export class ValidationUtils {
  // Validate trade parameters
  static validateTradeParams(params: any): string[] {
    const errors: string[] = [];

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

    if (!params.currencyPair || typeof params.currencyPair !== 'string') {
      errors.push('Valid currency pair is required');
    }

    // Web3 validation
    if (params.walletAddress && !this.isValidAddress(params.walletAddress)) {
      errors.push('Invalid wallet address');
    }

    return errors;
  }

  // Validate Ethereum address
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Validate numeric range
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // Sanitize input
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Validate currency pair format
  static isValidCurrencyPair(pair: string): boolean {
    return /^[A-Z]{3,10}\/[A-Z]{3,10}$/.test(pair);
  }
}