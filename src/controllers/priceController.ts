import { Request, Response } from 'express';
import { ethers } from 'ethers';
import pool from '../models/database.js';

export class PriceController {
  // Get real-time price from multiple sources
  static async getPrice(req: Request, res: Response) {
    try {
      const { currencyPair } = req.params;
      
      if (!currencyPair) {
        return res.status(400).json({
          error: 'Currency pair is required'
        });
      }

      // Try to get price from different sources
      const price = await PriceController.fetchPriceFromSources(currencyPair);
      
      // Save price to database
      await PriceController.savePriceFeed(currencyPair, price, 'api');

      res.json({
        success: true,
        data: {
          currencyPair,
          price,
          timestamp: new Date().toISOString(),
          source: 'multiple'
        }
      });

    } catch (error: any) {
      console.error('Price fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch price',
        message: error.message
      });
    }
  }

  // Fetch price from multiple Web3 sources
private static async fetchPriceFromSources(currencyPair: string): Promise<number> {
  // Create an array of sources with names
  const sources = [
    { name: 'Chainlink', method: PriceController.fetchFromChainlink },
    { name: 'Binance', method: PriceController.fetchFromBinance },
    { name: 'Coingecko', method: PriceController.fetchFromCoingecko }
  ];

  for (const source of sources) {
    try {
      const price = await source.method(currencyPair);
      if (price > 0) {
        console.log(`✅ Price from ${source.name}: ${price}`);
        return price;
      }
    } catch (error: any) {
      console.warn(`⚠️ ${source.name} failed:`, error.message);
    }
  }


    // Fallback to mock price
    return PriceController.getMockPrice(currencyPair);
  }

  // Chainlink Price Feed (Web3)
  private static async fetchFromChainlink(currencyPair: string): Promise<number> {
    // Chainlink price feed addresses
    const priceFeeds: { [key: string]: string } = {
      'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'SOL/USD': '0x4ffC43a60e009B551865A93d232E1F8dAa817A03'
    };

    const feedAddress = priceFeeds[currencyPair];
    if (!feedAddress) throw new Error(`No Chainlink feed for ${currencyPair}`);

    // ABI for Chainlink price feed
    const abi = [
      'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)'
    ];

    const provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL || 'https://mainnet.infura.io/v3/your-project-id');
    const contract = new ethers.Contract(feedAddress, abi, provider);
    
    const roundData = await contract.latestRoundData();
    const price = parseInt(roundData.answer) / 1e8; // Chainlink returns 8 decimals
    
    return price;
  }

  // Binance API
  private static async fetchFromBinance(currencyPair: string): Promise<number> {
    const symbol = currencyPair.replace('/', '').toUpperCase();
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    
    if (!response.ok) throw new Error('Binance API failed');
    
    const data = await response.json();
    return parseFloat(data.price);
  }

  // CoinGecko API
  private static async fetchFromCoingecko(currencyPair: string): Promise<number> {
    const coinIds: { [key: string]: string } = {
      'BTC/USD': 'bitcoin',
      'ETH/USD': 'ethereum',
      'SOL/USD': 'solana'
    };

    const coinId = coinIds[currencyPair];
    if (!coinId) throw new Error(`No CoinGecko ID for ${currencyPair}`);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    
    if (!response.ok) throw new Error('CoinGecko API failed');
    
    const data = await response.json();
    return data[coinId].usd;
  }

  // Mock price fallback
  private static getMockPrice(currencyPair: string): number {
    const mockPrices: { [key: string]: number } = {
      'BTC/USD': 45000,
      'ETH/USD': 3000,
      'SOL/USD': 100
    };
    
    return mockPrices[currencyPair] || 1;
  }

  // Save price to database
  private static async savePriceFeed(currencyPair: string, price: number, source: string) {
    try {
      await pool.query(
        'INSERT INTO price_feeds (currency_pair, price, source) VALUES ($1, $2, $3)',
        [currencyPair, price, source]
      );
    } catch (error) {
      console.error('Error saving price feed:', error);
    }
  }

  // Get price history
  static async getPriceHistory(req: Request, res: Response) {
    try {
      const { currencyPair, hours = 24 } = req.query;

      if (!currencyPair) {
        return res.status(400).json({
          error: 'Currency pair is required'
        });
      }

      const history = await pool.query(
        `SELECT currency_pair, price, source, timestamp 
         FROM price_feeds 
         WHERE currency_pair = $1 AND timestamp >= NOW() - INTERVAL '${hours} hours'
         ORDER BY timestamp DESC`,
        [currencyPair]
      );

      res.json({
        success: true,
        data: history.rows
      });

    } catch (error: any) {
      console.error('Price history error:', error);
      res.status(500).json({
        error: 'Failed to fetch price history',
        message: error.message
      });
    }
  }
}