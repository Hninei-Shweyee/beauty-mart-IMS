import db from '../config/db.js';
import { calculateProfitMmk, convertThbToMmk } from '../utils/currency.js';

const normalizePrice = (value) => {
  if (!value) {
    return null;
  }

  const price = Number(String(value).replace(/,/g, '').trim());
  return Number.isNaN(price) ? null : price;
};

const normalizeQuantity = (value) => {
  if (!value) {
    return null;
  }

  const quantity = Number(String(value).replace(/,/g, '').trim());
  return Number.isNaN(quantity) ? null : quantity;
};

const extractField = (text, labels) => {
  const labelPattern = labels.map((label) => label.replace(/\s+/g, '\\s+')).join('|');
  const regex = new RegExp(`^\\s*(?:${labelPattern})\\s*[-:=]\\s*(.+?)\\s*$`, 'im');
  const match = text.match(regex);

  return match ? match[1].trim() : null;
};

const parseOrderText = (rawOrder) => ({
  date: extractField(rawOrder, ['Date']),
  sales_person: extractField(rawOrder, ['Sale person', 'Sales Person']),
  customer_name: extractField(rawOrder, ['Name', 'Customer Name']),
  brand: extractField(rawOrder, ['Brand']),
  product: extractField(rawOrder, ['Product', 'Item']),
  shade: extractField(rawOrder, ['Shade']),
  category: extractField(rawOrder, ['Category']),
  quantity: normalizeQuantity(extractField(rawOrder, ['Total', 'Quantity'])),
  price: normalizePrice(extractField(rawOrder, ['Price'])),
  payment: extractField(rawOrder, ['Payment']),
  duration: extractField(rawOrder, ['Duration']),
  facebook_acc: extractField(rawOrder, ['Facebook Acc'])
});

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatOrderDate = (dateText) => {
  if (!dateText) {
    return formatLocalDate();
  }

  const trimmedDate = dateText.trim();
  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return trimmedDate;
  }

  const textDateMatch = trimmedDate.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);

  if (textDateMatch) {
    const [, day, monthName, year] = textDateMatch;
    const monthMap = {
      jan: '01',
      january: '01',
      feb: '02',
      february: '02',
      mar: '03',
      march: '03',
      apr: '04',
      april: '04',
      may: '05',
      jun: '06',
      june: '06',
      jul: '07',
      july: '07',
      aug: '08',
      august: '08',
      sep: '09',
      sept: '09',
      september: '09',
      oct: '10',
      october: '10',
      nov: '11',
      november: '11',
      dec: '12',
      december: '12'
    };
    const month = monthMap[monthName.toLowerCase()];

    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  const parsedDate = new Date(trimmedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return formatLocalDate();
  }

  return formatLocalDate(parsedDate);
};

const validateParsedOrder = (order) => {
  const missingFields = [];

  if (!order.customer_name) missingFields.push('customer name');
  if (!order.brand) missingFields.push('brand');
  if (!order.product) missingFields.push('product');
  if (!order.shade) missingFields.push('shade');

  if (missingFields.length > 0) {
    return `Missing required order fields: ${missingFields.join(', ')}.`;
  }

  return null;
};

export const parseOrder = async (req, res) => {
  const { rawOrder } = req.body;

  if (!rawOrder) {
    return res.status(400).json({ message: 'Order text is required.' });
  }

  res.json(parseOrderText(rawOrder));
};

export const saveOrderFromText = async (req, res, next) => {
  const { rawOrder } = req.body;

  if (!rawOrder) {
    return res.status(400).json({ message: 'Order text is required.' });
  }

  const parsedOrder = parseOrderText(rawOrder);
  const validationError = validateParsedOrder(parsedOrder);

  if (validationError) {
    return res.status(400).json({ message: validationError, order: parsedOrder });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [products] = await connection.query(
      `SELECT *
       FROM products
       WHERE LOWER(brand) = LOWER(?)
         AND LOWER(product_name) = LOWER(?)
         AND LOWER(COALESCE(shade, '')) = LOWER(?)
       LIMIT 1
       FOR UPDATE`,
      [parsedOrder.brand, parsedOrder.product, parsedOrder.shade || '']
    );

    const product = products[0];

    if (!product) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Product not found. Please add this product to inventory first.',
        order: parsedOrder
      });
    }

    const quantity = parsedOrder.quantity || 1;
    const buyPriceThb = Number(product.buy_price);
    const buyPriceMmk = convertThbToMmk(buyPriceThb);
    const sellPrice = parsedOrder.price ?? Number(product.sell_price);
    const totalAmount = sellPrice * quantity;
    const totalProfit = calculateProfitMmk({
      sellPriceMmk: sellPrice,
      buyPriceThb,
      quantity
    });

    let customerId;
    const customerLookupValues = parsedOrder.facebook_acc
      ? [parsedOrder.facebook_acc, parsedOrder.customer_name]
      : [null, parsedOrder.customer_name];

    const [customers] = await connection.query(
      `SELECT id
       FROM customers
       WHERE (? IS NOT NULL AND facebook_acc = ?)
          OR name = ?
       LIMIT 1`,
      [customerLookupValues[0], customerLookupValues[0], customerLookupValues[1]]
    );

    if (customers[0]) {
      customerId = customers[0].id;
    } else {
      const [customerResult] = await connection.query(
        'INSERT INTO customers (name, facebook_acc) VALUES (?, ?)',
        [parsedOrder.customer_name, parsedOrder.facebook_acc]
      );
      customerId = customerResult.insertId;
    }

    const [saleResult] = await connection.query(
      `INSERT INTO sales
        (customer_id, sales_person, order_date, total_amount, total_profit, payment_method, delivery_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        parsedOrder.sales_person || 'Unknown',
        formatOrderDate(parsedOrder.date),
        totalAmount,
        totalProfit,
        parsedOrder.payment,
        'pending',
        parsedOrder.duration ? `Duration: ${parsedOrder.duration}` : null
      ]
    );

    const saleId = saleResult.insertId;

    const [saleItemResult] = await connection.query(
      `INSERT INTO sale_items
        (sale_id, product_id, quantity, buy_price, sell_price, profit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [saleId, product.id, quantity, buyPriceMmk, sellPrice, totalProfit]
    );

    await connection.query(
      'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
      [quantity, product.id]
    );

    const [stockMovementResult] = await connection.query(
      `INSERT INTO stock_movements (product_id, movement_type, quantity, note)
       VALUES (?, ?, ?, ?)`,
      [product.id, 'OUT', quantity, `Sale #${saleId} from pasted order`]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Order saved successfully.',
      order: parsedOrder,
      sale: {
        id: saleId,
        customer_id: customerId,
        total_amount: totalAmount,
        total_profit: totalProfit
      },
      sale_item: {
        id: saleItemResult.insertId,
        product_id: product.id,
        quantity,
        buy_price: buyPriceMmk,
        sell_price: sellPrice,
        profit: totalProfit
      },
      stock_movement: {
        id: stockMovementResult.insertId,
        product_id: product.id,
        movement_type: 'OUT',
        quantity
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const saveManualOrder = async (req, res, next) => {
  const {
    date,
    sales_person,
    customer_name,
    brand,
    product,
    product_name,
    shade,
    quantity,
    price,
    payment,
    facebook_acc
  } = req.body;

  const rawOrder = [
    `Date - ${date || ''}`,
    `Sale person - ${sales_person || ''}`,
    `Name - ${customer_name || ''}`,
    `Brand - ${brand || ''}`,
    `Product - ${product || product_name || ''}`,
    `Shade - ${shade || ''}`,
    `Total = ${quantity || ''}`,
    `Price - ${price || ''}`,
    `Payment - ${payment || ''}`,
    `Facebook Acc - ${facebook_acc || ''}`
  ].join('\n');

  req.body.rawOrder = rawOrder;
  return saveOrderFromText(req, res, next);
};

export const pasteOrder = async (req, res) => {
  const { rawOrder } = req.body;

  if (!rawOrder) {
    return res.status(400).json({ message: 'Order text is required.' });
  }

  res.json({
    message: 'Order received.',
    order: parseOrderText(rawOrder)
  });
};
