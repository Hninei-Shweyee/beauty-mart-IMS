import db from '../config/db.js';

export const getCustomers = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();

    if (search) {
      const likeSearch = `%${search}%`;
      const [customers] = await db.query(
        `SELECT id, name, phone, address, facebook_acc, created_at
         FROM customers
         WHERE name LIKE ? OR phone LIKE ? OR facebook_acc LIKE ?
         ORDER BY created_at DESC, id DESC`,
        [likeSearch, likeSearch, likeSearch]
      );

      return res.json(customers);
    }

    const [customers] = await db.query(
      `SELECT id, name, phone, address, facebook_acc, created_at
       FROM customers
       ORDER BY created_at DESC, id DESC`
    );

    res.json(customers);
  } catch (error) {
    next(error);
  }
};
