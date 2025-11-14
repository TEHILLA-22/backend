export interface TradeCalculation {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  leverage: number;
  currencyPair: string;
  walletAddress?: string;
}

export interface CalculationResult {
  profit: number;
  loss: number;
  riskRewardRatio: number;
  positionSize: number;
  leverage: number;
  currencyPair: string;
}

export interface TradingSession {
  id: string;
  user_id: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  position_size: number;
  leverage: number;
  currency_pair: string;
  calculated_profit: number;
  calculated_loss: number;
  risk_reward_ratio: number;
  created_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}