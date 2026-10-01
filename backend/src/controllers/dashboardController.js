import db from '../config/db.js';

const buildSalesFilter = ({ start_date, end_date }) => {
  const where = [];
  const values = [];

  if (start_date) {
    where.push('order_date >= ?');
    values.push(start_date);
  }

  if (end_date) {
    where.push('order_date <= ?');
    values.push(end_date);
  }

  return {
    whereClause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { whereClause, values } = buildSalesFilter(req.query);
    const [
      [salesTotalRows],
      [productRows],
      [customerRows],
      [orderRows],
      [lowStockProducts]
    ] = await Promise.all([
      db.query(
        `SELECT
          COALESCE(SUM(total_amount), 0) AS total_sales_amount,
          COALESCE(SUM(total_profit), 0) AS total_profit,
          COUNT(*) AS filtered_orders,
          COUNT(DISTINCT customer_id) AS filtered_customers
         FROM sales
         ${whereClause}`,
        values
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_products,
          SUM(CASE WHEN stock_quantity <= low_stock_alert THEN 1 ELSE 0 END) AS low_stock_products
         FROM products`
      ),
      db.query('SELECT COUNT(*) AS total_customers FROM customers'),
      db.query('SELECT COUNT(*) AS total_orders FROM sales'),
      db.query(
        `SELECT
          id,
          brand,
          product_name,
          category,
          shade,
          stock_quantity,
          low_stock_alert
         FROM products
         WHERE stock_quantity <= low_stock_alert
         ORDER BY stock_quantity ASC, product_name ASC`
      )
    ]);

    res.json({
      summary: {
        total_sales_amount: Number(salesTotalRows[0].total_sales_amount || 0),
        total_profit: Number(salesTotalRows[0].total_profit || 0),
        filtered_orders: Number(salesTotalRows[0].filtered_orders || 0),
        filtered_customers: Number(salesTotalRows[0].filtered_customers || 0),
        total_products: Number(productRows[0].total_products || 0),
        low_stock_products: Number(productRows[0].low_stock_products || 0),
        total_customers: Number(customerRows[0].total_customers || 0),
        total_orders: Number(orderRows[0].total_orders || 0)
      },
      low_stock_products: lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};
