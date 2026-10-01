import db from '../config/db.js';

const productFields = [
  'brand',
  'product_name',
  'category',
  'shade',
  'buy_price',
  'sell_price',
  'stock_quantity',
  'low_stock_alert'
];

const normalizeProductInput = (body) => ({
  brand: body.brand?.trim(),
  product_name: body.product_name?.trim(),
  category: body.category?.trim() || null,
  shade: body.shade?.trim() || null,
  buy_price: Number(body.buy_price || 0),
  sell_price: Number(body.sell_price || 0),
  stock_quantity: Number(body.stock_quantity || 0),
  low_stock_alert: Number(body.low_stock_alert || 5)
});

export const getProducts = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();

    if (search) {
      const likeSearch = `%${search}%`;
      const [products] = await db.query(
        `SELECT * FROM products
         WHERE brand LIKE ? OR product_name LIKE ? OR shade LIKE ?
         ORDER BY id DESC`,
        [likeSearch, likeSearch, likeSearch]
      );

      return res.json(products);
    }

    const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
    const product = products[0];

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = normalizeProductInput(req.body);

    if (!product.brand || !product.product_name) {
      return res.status(400).json({ message: 'Brand and product name are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO products
        (brand, product_name, category, shade, buy_price, sell_price, stock_quantity, low_stock_alert)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      productFields.map((field) => product[field])
    );

    res.status(201).json({
      id: result.insertId,
      ...product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = normalizeProductInput(req.body);

    if (!product.brand || !product.product_name) {
      return res.status(400).json({ message: 'Brand and product name are required.' });
    }

    const [result] = await db.query(
      `UPDATE products
       SET brand = ?,
           product_name = ?,
           category = ?,
           shade = ?,
           buy_price = ?,
           sell_price = ?,
           stock_quantity = ?,
           low_stock_alert = ?
       WHERE id = ?`,
      [...productFields.map((field) => product[field]), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({
      id: Number(req.params.id),
      ...product
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product deleted.' });
  } catch (error) {
    next(error);
  }
};
