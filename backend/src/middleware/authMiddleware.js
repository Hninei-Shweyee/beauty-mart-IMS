import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default authMiddleware;
