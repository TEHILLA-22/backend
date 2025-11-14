import { TradeCalculation, CalculationResult } from '../models/types.js';

export class CalculationService {
  static calculateTrade(params: TradeCalculation): CalculationResult {
    const {
      entryPrice,
      stopLoss,
      takeProfit,
      positionSize,
      leverage = 1,
      currencyPair
    } = params;

    // Validate inputs
    if (entryPrice <= 0 || stopLoss <= 0 || takeProfit <= 0 || positionSize <= 0) {
      throw new Error('All prices and position size must be positive');
    }

    if (leverage < 1) {
      throw new Error('Leverage must be at least 1');
    }

    // Calculate profit/loss
    const priceDifferenceTP = takeProfit - entryPrice;
    const priceDifferenceSL = stopLoss - entryPrice;
    
    const calculatedProfit = (priceDifferenceTP / entryPrice) * positionSize * leverage;
    const calculatedLoss = (priceDifferenceSL / entryPrice) * positionSize * leverage;
    
    const riskRewardRatio = Math.abs(calculatedProfit / calculatedLoss);

    return {
      profit: Number(calculatedProfit.toFixed(2)),
      loss: Number(calculatedLoss.toFixed(2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(4)),
      positionSize,
      leverage,
      currencyPair
    };
  }

  static validateTrade(params: TradeCalculation): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!params.entryPrice || params.entryPrice <= 0) {
      errors.push('Entry price must be positive');
    }

    if (!params.stopLoss || params.stopLoss <= 0) {
      errors.push('Stop loss must be positive');
    }

    if (!params.takeProfit || params.takeProfit <= 0) {
      errors.push('Take profit must be positive');
    }

    if (!params.positionSize || params.positionSize <= 0) {
      errors.push('Position size must be positive');
    }

    if (params.leverage && params.leverage < 1) {
      errors.push('Leverage must be at least 1');
    }

    // Remove the strict business logic validation that's causing issues
    // Instead, use more flexible validation that allows both long and short positions
    
    if (params.entryPrice && params.stopLoss && params.takeProfit) {
      // Check if it's a valid long position (TP > Entry > SL)
      const isLongValid = params.takeProfit > params.entryPrice && params.entryPrice > params.stopLoss;
      
      // Check if it's a valid short position (TP < Entry < SL)  
      const isShortValid = params.takeProfit < params.entryPrice && params.entryPrice < params.stopLoss;
      
      if (!isLongValid && !isShortValid) {
        errors.push('Invalid trade parameters: For long positions, Take Profit > Entry > Stop Loss. For short positions, Take Profit < Entry < Stop Loss.');
      }
    }

    return errors;
  }
}