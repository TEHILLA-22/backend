import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

// Import routes
import tradeRoutes from './routes/tradeRoutes.js';
import priceRoutes from './routes/priceRoutes.js';


const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trades', tradeRoutes);
app.use('/api/prices', priceRoutes);

// Health check with Web3 status
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    message: 'Trading Calculator API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      web3: 'available'
    }
  };

  res.status(200).json(health);
});

// Web3 status endpoint - FIXED IMPORT
app.get('/api/web3/status', async (req, res) => {
  try {
    // Use relative path without extension for TypeScript
    const web3Module = await import('./utilis/web3.js');
    const Web3Utils = web3Module.Web3Utils;
    
    const provider = Web3Utils.getProvider();
    const blockNumber = await provider.getBlockNumber();
    
    res.json({
      connected: true,
      blockNumber,
      network: await provider.getNetwork(),
      provider: process.env.WEB3_PROVIDER_URL || 'local'
    });
  } catch (error: any) {
    console.error('Web3 connection error:', error);
    res.json({
      connected: false,
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default app;