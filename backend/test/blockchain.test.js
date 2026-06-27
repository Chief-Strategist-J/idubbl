import { test } from 'node:test';
import assert from 'node:assert';
import { blockchainService } from '../services/index.js';

test('BlockchainService - Configuration Loading', () => {
  assert.ok(blockchainService.platformWalletTron, 'Platform TRON wallet should be configured.');
  assert.ok(blockchainService.platformWalletEthereum, 'Platform Ethereum wallet should be configured.');
  assert.ok(blockchainService.adapters.tron, 'TronGridAdapter should be loaded.');
  assert.ok(blockchainService.adapters.ethereum, 'EtherscanAdapter should be loaded.');
  
  assert.strictEqual(blockchainService.adapters.tron.apiKey, '1aba6f7f-092d-4640-9a50-3987a7383e33', 'TRON API key should match the configured key.');
  assert.strictEqual(blockchainService.adapters.ethereum.apiKey, '5I3STHGMTCUVHEBBEWNUSVTRZU2ZFZNJ3F', 'Etherscan API key should match the configured key.');
});

test('BlockchainService - Network routing validation', async () => {
  // Test unsupported network
  const result = await blockchainService.verifyUSDTDeposit('0x123', 'SOLANA', 10);
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Unsupported blockchain network'));
});
