import config from '../configLoader.js';
import { TronGridAdapter } from './adapters/TronGridAdapter.js';
import { EtherscanAdapter } from './adapters/EtherscanAdapter.js';
import { WalletGenerator } from './WalletGenerator.js';

export class BlockchainService {
  constructor() {
    // 1. Load wallet addresses from config or environment variables
    this.platformWalletTron = process.env.PLATFORM_WALLET_TRON || config.blockchain?.wallets?.tron || 'TDsqW9XXXXXXXXXXXXXXXXXXXXXXX';
    this.platformWalletEthereum = process.env.PLATFORM_WALLET_ETHEREUM || config.blockchain?.wallets?.ethereum || '0xdac17f958d2ee523a2206206994597c13d831ec7';

    // 2. Initialize adapters
    this.adapters = {
      tron: new TronGridAdapter({
        apiKey: process.env.TRONGRID_API_KEY || config.blockchain?.keys?.trongrid,
        baseUrl: process.env.TRONGRID_BASE_URL || config.blockchain?.urls?.trongrid,
      }),
      ethereum: new EtherscanAdapter({
        apiKey: process.env.ETHERSCAN_API_KEY || config.blockchain?.keys?.etherscan,
        baseUrl: process.env.ETHERSCAN_BASE_URL || config.blockchain?.urls?.etherscan,
      }),
    };
  }

  /**
   * Route transaction verification to the appropriate adapter based on network name.
   * Supports inputs like 'TRC20', 'TRC20 (TRON)', 'ERC20', 'ERC20 (Ethereum)'
   */
  async verifyUSDTDeposit(txHash, network, amount) {
    const normalizedNetwork = (network || '').toUpperCase();
    
    if (normalizedNetwork.includes('TRC20') || normalizedNetwork.includes('TRON')) {
      return await this.adapters.tron.verifyTransaction(txHash, amount, this.platformWalletTron);
    } 
    
    if (normalizedNetwork.includes('ERC20') || normalizedNetwork.includes('ETHEREUM')) {
      return await this.adapters.ethereum.verifyTransaction(txHash, amount, this.platformWalletEthereum);
    }

    return { success: false, error: `Unsupported blockchain network: ${network}` };
  }

  /**
   * Generate a fresh personal wallet for a user.
   */
  generatePersonalWallet() {
    return WalletGenerator.generateKeyPair();
  }

  /**
   * Query the live on-chain balance of a wallet.
   */
  async getOnchainUSDTBalance(address, network) {
    const normalizedNetwork = (network || '').toUpperCase();

    if (normalizedNetwork.includes('TRC20') || normalizedNetwork.includes('TRON')) {
      return await this.adapters.tron.getUSDTBalance(address);
    }

    if (normalizedNetwork.includes('ERC20') || normalizedNetwork.includes('ETHEREUM')) {
      return await this.adapters.ethereum.getUSDTBalance(address);
    }

    return 0;
  }
}

export const blockchainService = new BlockchainService();
