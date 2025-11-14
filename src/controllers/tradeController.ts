import { Request, Response } from 'express';
import { CalculationService } from '../services/calculationService.js';
import pool from '../models/database.js';
import { TradeCalculation, CalculationResult } from '../models/types.js';

export class TradeController {
  // Calculate profit/loss for a trade
  static async calculateTrade(req: Request, res: Response) {
    try {
      const {
        entryPrice,
        stopLoss,
        takeProfit,
        positionSize,
        leverage = 1,
        currencyPair,
        walletAddress
      }: TradeCalculation = req.body;

      // Validate required fields
      if (!entryPrice || !stopLoss || !takeProfit || !positionSize || !currencyPair) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['entryPrice', 'stopLoss', 'takeProfit', 'positionSize', 'currencyPair']
        });
      }

      // Validate trade parameters
      const validationErrors = CalculationService.validateTrade({
        entryPrice, stopLoss, takeProfit, positionSize, leverage, currencyPair
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }

      // Calculate profit/loss
      const calculationResult = CalculationService.calculateTrade({
        entryPrice, stopLoss, takeProfit, positionSize, leverage, currencyPair
      });

      // Save to database if wallet address provided
      if (walletAddress) {
        await TradeController.saveTradingSession({
          entryPrice,
          stopLoss,
          takeProfit,
          positionSize,
          leverage,
          currencyPair,
          walletAddress,
          calculationResult
        });
      }

      res.json({
        success: true,
        data: calculationResult,
        message: 'Trade calculated successfully'
      });

    } catch (error: any) {
      console.error('Trade calculation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Save trading session to database
  private static async saveTradingSession(params: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    leverage: number;
    currencyPair: string;
    walletAddress: string;
    calculationResult: CalculationResult;
  }) {
    const {
      entryPrice,
      stopLoss,
      takeProfit,
      positionSize,
      leverage,
      currencyPair,
      walletAddress,
      calculationResult
    } = params;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get or create user
      const userResult = await client.query(
        `INSERT INTO users (wallet_address) 
         VALUES ($1) 
         ON CONFLICT (wallet_address) DO UPDATE SET updated_at = NOW() 
         RETURNING id`,
        [walletAddress]
      );
      
      const userId = userResult.rows[0].id;

      // Save trading session
      await client.query(
        `INSERT INTO trading_sessions 
         (user_id, entry_price, stop_loss, take_profit, position_size, leverage, currency_pair, calculated_profit, calculated_loss, risk_reward_ratio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          entryPrice,
          stopLoss,
          takeProfit,
          positionSize,
          leverage,
          currencyPair,
          calculationResult.profit,
          calculationResult.loss,
          calculationResult.riskRewardRatio
        ]
      );

      await client.query('COMMIT');
      console.log('✅ Trading session saved for wallet:', walletAddress);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving trading session:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get trading history for a wallet
  static async getTradeHistory(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({
          error: 'Wallet address is required'
        });
      }

      const history = await pool.query(
        `SELECT 
          ts.id,
          ts.entry_price as "entryPrice",
          ts.stop_loss as "stopLoss", 
          ts.take_profit as "takeProfit",
          ts.position_size as "positionSize",
          ts.leverage,
          ts.currency_pair as "currencyPair",
          ts.calculated_profit as "profit",
          ts.calculated_loss as "loss",
          ts.risk_reward_ratio as "riskRewardRatio",
          ts.created_at as "createdAt"
         FROM trading_sessions ts 
         JOIN users u ON ts.user_id = u.id 
         WHERE u.wallet_address = $1 
         ORDER BY ts.created_at DESC 
         LIMIT 50`,
        [walletAddress]
      );

      res.json({
        success: true,
        data: history.rows,
        count: history.rows.length
      });

    } catch (error: any) {
      console.error('Trade history error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get recent trades (for dashboard)
  static async getRecentTrades(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;

      const recentTrades = await pool.query(
        `SELECT 
          ts.entry_price as "entryPrice",
          ts.stop_loss as "stopLoss",
          ts.take_profit as "takeProfit", 
          ts.position_size as "positionSize",
          ts.leverage,
          ts.currency_pair as "currencyPair",
          ts.calculated_profit as "profit",
          ts.calculated_loss as "loss", 
          ts.risk_reward_ratio as "riskRewardRatio",
          ts.created_at as "createdAt",
          u.wallet_address as "walletAddress"
         FROM trading_sessions ts
         JOIN users u ON ts.user_id = u.id
         ORDER BY ts.created_at DESC 
         LIMIT $1`,
        [limit]
      );

      res.json({
        success: true,
        data: recentTrades.rows
      });

    } catch (error: any) {
      console.error('Recent trades error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}