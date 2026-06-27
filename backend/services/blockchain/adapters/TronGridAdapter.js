import fetch from 'node-fetch';
import { BlockchainPort } from '../ports/BlockchainPort.js';

// Base58 decoding helper for Tron addresses
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}

function base58Decode(string) {
  if (string.length === 0) return new Uint8Array(0);
  let bytes = [0];
  for (let i = 0; i < string.length; i++) {
    const c = string[i];
    if (!(c in ALPHABET_MAP)) throw new Error('Non-base58 character');
    let carry = ALPHABET_MAP[c];
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; string[i] === '1' && i < string.length - 1; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

function tronAddressToHex(address58) {
  try {
    const decoded = base58Decode(address58);
    if (decoded.length < 5) return '';
    const addressBytes = decoded.slice(0, -4);
    return Array.from(addressBytes, byte => byte.toString(16).padStart(2, '0')).join('').toLowerCase();
  } catch (e) {
    return '';
  }
}

export class TronGridAdapter extends BlockchainPort {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.TRONGRID_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.trongrid.io';
    // USDT Contract Address on Tron Mainnet
    this.usdtContractHex = '41a614f803b6fd5c617a480d12e622bde91a6d84d3'; // TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t in Hex
  }

  async verifyTransaction(txHash, expectedAmount, expectedReceiver) {
    const endpoint = `${this.baseUrl}/wallet/gettransactionbyid`;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['TRON-PRO-API-KEY'] = this.apiKey;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ value: txHash }),
      });

      if (!response.ok) {
        return { success: false, error: `TronGrid responded with status ${response.status}` };
      }

      const tx = await response.json();

      // 1. Verify transaction exists and was successful
      if (!tx || !tx.txID) {
        return { success: false, error: 'Transaction not found on Tron blockchain.' };
      }
      if (tx.ret && tx.ret[0] && tx.ret[0].contractRet !== 'SUCCESS') {
        return { success: false, error: `Transaction failed with status: ${tx.ret[0].contractRet}` };
      }

      // 2. Extract smart contract parameters
      const contract = tx.raw_data?.contract?.[0];
      if (!contract || contract.type !== 'TriggerSmartContract') {
        return { success: false, error: 'Not a smart contract trigger transaction.' };
      }

      const parameterValue = contract.parameter?.value;
      if (!parameterValue) {
        return { success: false, error: 'Missing contract trigger parameters.' };
      }

      // 3. Verify contract is the official USDT contract
      const contractAddress = parameterValue.contract_address?.toLowerCase();
      if (contractAddress !== this.usdtContractHex) {
        return { success: false, error: 'Transaction is not a USDT contract call.' };
      }

      // 4. Parse transfer data: transfer(address _to, uint256 _value)
      // Method signature for transfer: a9059cbb
      const data = parameterValue.data;
      if (!data || !data.startsWith('a9059cbb')) {
        return { success: false, error: 'Contract call is not a token transfer.' };
      }

      // Extract destination address (next 64 hex characters) and amount (following 64 hex characters)
      const recipientPart = data.substring(8, 72).replace(/^0+/, ''); // Remove leading zeros
      // Recipient in hex needs to match Tron's hex format (starts with 41 + 20-byte address)
      const recipientHex = '41' + recipientPart.padStart(40, '0').toLowerCase();

      const expectedReceiverHex = expectedReceiver.startsWith('T')
        ? tronAddressToHex(expectedReceiver)
        : expectedReceiver.toLowerCase();

      if (recipientHex !== expectedReceiverHex) {
        return { success: false, error: `Recipient address mismatch. Expected: ${expectedReceiverHex}, got: ${recipientHex}` };
      }

      // Extract amount
      const amountPart = data.substring(72, 136);
      const amountHex = amountPart.replace(/^0+/, '') || '0';
      const rawAmount = parseInt(amountHex, 16);
      // USDT Tron has 6 decimals
      const actualAmount = rawAmount / 1_000_000;

      if (actualAmount < expectedAmount) {
        return { success: false, error: `Insufficient amount. Expected at least: ${expectedAmount}, got: ${actualAmount}` };
      }

      return {
        success: true,
        amount: actualAmount,
        note: `Auto-verified on Tron TRC-20. Block: ${tx.blockNumber || 'confirmed'}`
      };

    } catch (error) {
      console.error('TronGrid verification error:', error);
      return { success: false, error: `TronGrid verification failed: ${error.message}` };
    }
  }

  /**
   * Fetch on-chain TRC-20 USDT balance for a specific address.
   */
  async getUSDTBalance(address) {
    const endpoint = `${this.baseUrl}/v1/accounts/${address}`;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers['TRON-PRO-API-KEY'] = this.apiKey;
      }

      const response = await fetch(endpoint, { method: 'GET', headers });
      if (!response.ok) {
        throw new Error(`TronGrid responded with status ${response.status}`);
      }

      const res = await response.json();
      if (!res.success || !res.data || res.data.length === 0) {
        return 0; // Account not active or no transactions on-chain yet
      }

      const trc20Balances = res.data[0].trc20 || [];
      const usdtContractHexUpper = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      
      // Find USDT balance
      const usdtInfo = trc20Balances.find(item => Object.keys(item)[0] === usdtContractHexUpper);
      if (!usdtInfo) return 0;

      const rawBalance = Object.values(usdtInfo)[0];
      return parseFloat(rawBalance) / 1_000_000;
    } catch (error) {
      console.error('Error fetching Tron balance:', error);
      return 0;
    }
  }
}
