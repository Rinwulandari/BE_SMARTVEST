import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// **Register User**
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('BODY:', req.body);

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    res.status(201).json({ message: 'User berhasil didaftarkan', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    console.error('Error during registration:', error);
  }
};

// **Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('BODY:', req.body);

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login berhasil', 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    console.error('Error during login:', error);
  }
};

// **Profile (Protected)**
export const profile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ message: 'Welcome to your profile', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
