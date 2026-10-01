import ExcelJS from 'exceljs';
import db from '../config/db.js';

const buildSalesQuery = (query) => {
  const { date, sales_person, search } = query;
  const where = [];
  const values = [];

  if (date) {
    where.push('s.order_date = ?');
    values.push(date);
  }

  if (sales_person) {
    where.push('s.sales_person = ?');
    values.push(sales_person);
  }

  if (search) {
    where.push('(c.name LIKE ? OR c.facebook_acc LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return {
    sql: `SELECT
      s.id AS sale_id,
      s.order_date,
      s.sales_person,
      s.total_amount,
      s.total_profit,
      s.payment_method,
      s.delivery_status,
      s.note,
      c.id AS customer_id,
      c.name AS customer_name,
      c.phone,
      c.address,
      c.facebook_acc,
      p.id AS product_id,
      p.brand,
      p.product_name,
      p.category,
      p.shade,
      si.id AS sale_item_id,
      si.quantity,
      si.buy_price,
      si.sell_price,
      si.profit
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     INNER JOIN sale_items si ON si.sale_id = s.id
     INNER JOIN products p ON p.id = si.product_id
     ${whereClause}
     ORDER BY s.order_date DESC, s.id DESC, si.id ASC`,
    values
  };
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const recalculateSaleTotals = async (connection, saleId) => {
  const [totals] = await connection.query(
    `SELECT
      COALESCE(SUM(quantity * sell_price), 0) AS total_amount,
      COALESCE(SUM(profit), 0) AS total_profit
     FROM sale_items
     WHERE sale_id = ?`,
    [saleId]
  );

  const totalAmount = Number(totals[0].total_amount || 0);
  const totalProfit = Number(totals[0].total_profit || 0);

  await connection.query(
    'UPDATE sales SET total_amount = ?, total_profit = ? WHERE id = ?',
    [totalAmount, totalProfit, saleId]
  );

  return { totalAmount, totalProfit };
};

export const getSalesRecords = async (req, res, next) => {
  try {
    const { sql, values } = buildSalesQuery(req.query);
    const [records] = await db.query(sql, values);

    res.json(records.map((record) => ({
      ...record,
      order_date: formatDate(record.order_date)
    })));
  } catch (error) {
    next(error);
  }
};

export const updateSaleRecord = async (req, res, next) => {
  const { saleId, itemId } = req.params;
  const {
    order_date,
    sales_person,
    customer_name,
    facebook_acc,
    quantity,
    sell_price,
    payment_method
  } = req.body;

  if (!order_date || !sales_person || !customer_name || !quantity || !sell_price) {
    return res.status(400).json({
      message: 'Date, sales person, customer name, quantity, and sell price are required.'
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT si.*, s.customer_id
       FROM sale_items si
       INNER JOIN sales s ON s.id = si.sale_id
       WHERE si.id = ? AND si.sale_id = ?
       LIMIT 1
       FOR UPDATE`,
      [itemId, saleId]
    );

    const item = items[0];

    if (!item) {
      await connection.rollback();
      return res.status(404).json({ message: 'Sales record not found.' });
    }

    const newQuantity = Number(quantity);
    const newSellPrice = Number(sell_price);

    if (newQuantity <= 0 || newSellPrice < 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Quantity must be greater than 0 and sell price cannot be negative.' });
    }

    const quantityDifference = newQuantity - Number(item.quantity);

    if (quantityDifference !== 0) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [quantityDifference, item.product_id]
      );

      await connection.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, note)
         VALUES (?, ?, ?, ?)`,
        [
          item.product_id,
          'ADJUSTMENT',
          Math.abs(quantityDifference),
          `Sale #${saleId} quantity edited from ${item.quantity} to ${newQuantity}`
        ]
      );
    }

    await connection.query(
      'UPDATE customers SET name = ?, facebook_acc = ? WHERE id = ?',
      [customer_name, facebook_acc || null, item.customer_id]
    );

    const profit = (newSellPrice - Number(item.buy_price)) * newQuantity;

    await connection.query(
      `UPDATE sale_items
       SET quantity = ?, sell_price = ?, profit = ?
       WHERE id = ? AND sale_id = ?`,
      [newQuantity, newSellPrice, profit, itemId, saleId]
    );

    const totals = await recalculateSaleTotals(connection, saleId);

    await connection.query(
      `UPDATE sales
       SET order_date = ?, sales_person = ?, payment_method = ?
       WHERE id = ?`,
      [order_date, sales_person, payment_method || null, saleId]
    );

    await connection.commit();

    res.json({
      message: 'Sales record updated.',
      sale_id: Number(saleId),
      sale_item_id: Number(itemId),
      total_amount: totals.totalAmount,
      total_profit: totals.totalProfit,
      profit
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

export const deleteSaleRecord = async (req, res, next) => {
  const { saleId } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [items] = await connection.query(
      'SELECT id, product_id, quantity FROM sale_items WHERE sale_id = ? FOR UPDATE',
      [saleId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Sales record not found.' });
    }

    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      await connection.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, note)
         VALUES (?, ?, ?, ?)`,
        [item.product_id, 'IN', item.quantity, `Sale #${saleId} deleted and stock restored`]
      );
    }

    await connection.query('DELETE FROM sales WHERE id = ?', [saleId]);
    await connection.commit();

    res.json({ message: 'Sales record deleted.' });
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

export const exportSalesExcel = async (req, res, next) => {
  try {
    const { sql, values } = buildSalesQuery(req.query);
    const [records] = await db.query(sql, values);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Records');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Sales Person', key: 'sales_person', width: 18 },
      { header: 'Customer Name', key: 'customer_name', width: 24 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Address', key: 'address', width: 28 },
      { header: 'Facebook Acc', key: 'facebook_acc', width: 24 },
      { header: 'Brand', key: 'brand', width: 18 },
      { header: 'Product', key: 'product_name', width: 28 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Shade', key: 'shade', width: 18 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Buy Price (MMK)', key: 'buy_price', width: 18 },
      { header: 'Sell Price (MMK)', key: 'sell_price', width: 18 },
      { header: 'Total Amount (MMK)', key: 'total_amount', width: 20 },
      { header: 'Profit (MMK)', key: 'profit', width: 16 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Delivery Status', key: 'delivery_status', width: 18 },
      { header: 'Note', key: 'note', width: 30 }
    ];

    records.forEach((record) => {
      worksheet.addRow({
        date: formatDate(record.order_date),
        sales_person: record.sales_person,
        customer_name: record.customer_name,
        phone: record.phone,
        address: record.address,
        facebook_acc: record.facebook_acc,
        brand: record.brand,
        product_name: record.product_name,
        category: record.category,
        shade: record.shade,
        quantity: record.quantity,
        buy_price: Number(record.buy_price || 0),
        sell_price: Number(record.sell_price || 0),
        total_amount: Number(record.total_amount || 0),
        profit: Number(record.profit || 0),
        payment_method: record.payment_method,
        delivery_status: record.delivery_status,
        note: record.note
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    ['buy_price', 'sell_price', 'total_amount', 'profit'].forEach((key) => {
      worksheet.getColumn(key).numFmt = '#,##0';
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="sales-records.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
