import { test } from 'node:test';
import assert from 'node:assert';
import { WalletGenerator } from '../services/blockchain/WalletGenerator.js';
import { blockchainService } from '../services/index.js';

test('WalletGenerator - Correct Address Derivations', () => {
  const wallets = WalletGenerator.generateKeyPair();
  
  // 1. Ethereum address checks
  assert.ok(wallets.ethereum, 'Ethereum wallet should be generated.');
  assert.ok(wallets.ethereum.address.startsWith('0x'), 'Ethereum address must start with 0x.');
  assert.strictEqual(wallets.ethereum.address.length, 42, 'Ethereum address must be 42 characters.');
  assert.ok(wallets.ethereum.privateKey, 'Ethereum private key should exist.');

  // 2. Tron address checks
  assert.ok(wallets.tron, 'Tron wallet should be generated.');
  assert.ok(wallets.tron.address.startsWith('T'), 'Tron address must start with T.');
  assert.strictEqual(wallets.tron.address.length, 34, 'Tron address must be 34 characters (Base58).');
  assert.ok(wallets.tron.privateKey, 'Tron private key should exist.');
});

test('BlockchainService - Personal wallet generation wrapper', () => {
  const wallets = blockchainService.generatePersonalWallet();
  assert.ok(wallets.tron.address.startsWith('T'));
  assert.ok(wallets.ethereum.address.startsWith('0x'));
});

test('BlockchainService - Fetching balance fallback on mock address', async () => {
  // Test fallback balance check returning number
  const balance = await blockchainService.getOnchainUSDTBalance('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', 'TRON');
  assert.strictEqual(typeof balance, 'number');
});
