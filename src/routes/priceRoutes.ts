import { Router } from 'express';
import { PriceController } from '../controllers/priceController.js';

const router = Router();

// Get current price for a currency pair
router.get('/:currencyPair', PriceController.getPrice);

// Get price history
router.get('/history/:currencyPair', PriceController.getPriceHistory);

export default router;