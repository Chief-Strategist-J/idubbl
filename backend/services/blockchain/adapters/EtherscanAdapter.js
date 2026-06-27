import fetch from 'node-fetch';
import { BlockchainPort } from '../ports/BlockchainPort.js';

export class EtherscanAdapter extends BlockchainPort {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.ETHERSCAN_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.etherscan.io/v2/api';
    // USDT Contract Address on Ethereum Mainnet
    this.usdtContract = '0xdac17f958d2ee523a2206206994597c13d831ec7';
  }

  async verifyTransaction(txHash, expectedAmount, expectedReceiver) {
    try {
      // Clean inputs
      const targetHash = txHash.trim().toLowerCase();
      const targetReceiver = expectedReceiver.trim().toLowerCase();
      const apiKeyParam = this.apiKey ? `&apikey=${this.apiKey}` : '';

      // 1. Fetch token transfer events for the receiver address (using Etherscan API V2)
      const endpoint = `${this.baseUrl}?chainid=1&module=account&action=tokentx&contractaddress=${this.usdtContract}&address=${targetReceiver}&page=1&offset=50&sort=desc${apiKeyParam}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        return { success: false, error: `Etherscan responded with status ${response.status}` };
      }

      const data = await response.json();

      if (data.status !== '1' || !Array.isArray(data.result)) {
        return { success: false, error: `Etherscan API error: ${data.message || 'No transfers found'}` };
      }

      // 2. Find the transaction matching our hash
      const transfer = data.result.find(tx => tx.hash.toLowerCase() === targetHash);

      if (!transfer) {
        return { success: false, error: 'Transaction hash not found in recent USDT transfers.' };
      }

      // 3. Verify target receiver matches
      if (transfer.to.toLowerCase() !== targetReceiver) {
        return { success: false, error: `Recipient address mismatch. Expected: ${targetReceiver}, got: ${transfer.to}` };
      }

      // 4. Verify amount
      const rawValue = transfer.value;
      const decimals = parseInt(transfer.tokenDecimal || '6', 10);
      const actualAmount = parseFloat(rawValue) / Math.pow(10, decimals);

      if (actualAmount < expectedAmount) {
        return { success: false, error: `Insufficient amount. Expected: ${expectedAmount}, got: ${actualAmount}` };
      }

      // 5. Check confirmations (Etherscan returns string confirmations)
      const confirmations = parseInt(transfer.confirmations || '0', 10);
      if (confirmations < 1) {
        return { success: false, error: 'Transaction has 0 confirmations. Please wait.' };
      }

      return {
        success: true,
        amount: actualAmount,
        note: `Auto-verified on Ethereum ERC-20. Confirmations: ${confirmations}`
      };

    } catch (error) {
      console.error('Etherscan verification error:', error);
      return { success: false, error: `Etherscan verification failed: ${error.message}` };
    }
  }

  /**
   * Fetch on-chain ERC-20 USDT balance for a specific address.
   */
  async getUSDTBalance(address) {
    try {
      const apiKeyParam = this.apiKey ? `&apikey=${this.apiKey}` : '';
      const endpoint = `${this.baseUrl}?chainid=1&module=account&action=tokenbalance&contractaddress=${this.usdtContract}&address=${address.trim()}&tag=latest${apiKeyParam}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Etherscan responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.status !== '1') {
        return 0;
      }

      // USDT ERC-20 has 6 decimals
      return parseFloat(data.result) / 1_000_000;
    } catch (error) {
      console.error('Error fetching Ethereum balance:', error);
      return 0;
    }
  }

  async getNativeBalance(address) {
    try {
      const apiKeyParam = this.apiKey ? `&apikey=${this.apiKey}` : '';
      const endpoint = `${this.baseUrl}?chainid=1&module=account&action=balance&address=${address.trim()}&tag=latest${apiKeyParam}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Etherscan responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.status !== '1') {
        return 0;
      }

      // Native ETH has 18 decimals (Wei)
      return parseFloat(data.result) / 1_000_000_000_000_000_000;
    } catch (error) {
      console.error('Error fetching native ETH balance:', error);
      return 0;
    }
  }
}
