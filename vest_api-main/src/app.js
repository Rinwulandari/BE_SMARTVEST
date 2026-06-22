import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import routerDev from './routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined'));

// Middleware untuk mengatur timeout
app.use((req, res, next) => {
  res.setTimeout(30000, () => { // 30000 ms = 30 detik
    res.status(408).send('Request timed out');
  });
  next();
});

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routerDev);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});

export default app;