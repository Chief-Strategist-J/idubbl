/**
 * BlockchainPort defines the interface for blockchain adapters.
 * Following Hexagonal Architecture (Port & Adapter pattern).
 */
export class BlockchainPort {
  /**
   * Verify a transaction on-chain.
   * @param {string} txHash - The transaction hash/ID.
   * @param {number} expectedAmount - The expected amount of USDT.
   * @param {string} expectedReceiver - The platform's wallet address.
   * @returns {Promise<{ success: boolean, amount?: number, note?: string }>}
   */
  async verifyTransaction(txHash, expectedAmount, expectedReceiver) {
    throw new Error('verifyTransaction must be implemented by adapter.');
  }

  /**
   * Fetch on-chain USDT balance for a specific address.
   * @param {string} address - The wallet address.
   * @returns {Promise<number>}
   */
  async getUSDTBalance(address) {
    throw new Error('getUSDTBalance must be implemented by adapter.');
  }
}
