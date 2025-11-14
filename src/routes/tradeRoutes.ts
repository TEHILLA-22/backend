import { Router } from 'express';
import { TradeController } from '../controllers/tradeController.js';

const router = Router();

// Calculate trade profit/loss
router.post('/calculate', TradeController.calculateTrade);

// Get trade history for a wallet
router.get('/history/:walletAddress', TradeController.getTradeHistory);

// Get recent trades
router.get('/recent', TradeController.getRecentTrades);

export default router;