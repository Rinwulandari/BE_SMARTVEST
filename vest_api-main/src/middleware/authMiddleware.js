import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ message: 'Token required' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Wrong token' });
      }
      req.user = decoded; // Menyimpan data pengguna dari token ke `req.user`
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
