import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors());

// Stripe webhook requires raw body — must be registered BEFORE express.json()
app.use('/api/auth/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RepoGraph API is running smoothly' });
});

// Serve compiled static client assets in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(process.cwd(), 'public');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start server
const start = async () => {
  // Start server listening first so it does not block client proxy requests
  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Connect database in the background
  connectDB();
  
  // Clean up any remaining temp files from previous runs
  const tempDir = path.resolve(process.cwd(), 'temp');
  await fs.ensureDir(tempDir);
  await fs.emptyDir(tempDir).catch(err => {
    console.error('Warning: could not clear server temp directory on startup:', err);
  });

  // Graceful shutdown to instantly free binding ports on nodemon reloads
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGUSR2', shutdown);
};

start();
