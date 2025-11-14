import { ethers } from 'ethers';

export class Web3Utils {
  // Validate Ethereum address
  static validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  // Create provider based on environment
  static getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.WEB3_PROVIDER_URL || 'http://localhost:8545';
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  // Get wallet balance
  static async getBalance(address: string): Promise<string> {
    try {
      const provider = Web3Utils.getProvider();
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  // Verify message signature (for authentication)
  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  // Generate nonce for authentication
  static generateNonce(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  // Format large numbers
  static formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  // Calculate gas estimate
  static async estimateGas(transaction: any): Promise<bigint> {
    const provider = Web3Utils.getProvider();
    return await provider.estimateGas(transaction);
  }
}