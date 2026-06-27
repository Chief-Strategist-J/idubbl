import crypto from 'crypto';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(buffer) {
  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let string = '';
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    string += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    string += ALPHABET[digits[i]];
  }
  return string;
}

function base58CheckEncode(addressBytes) {
  const hash1 = crypto.createHash('sha256').update(addressBytes).digest();
  const hash2 = crypto.createHash('sha256').update(hash1).digest();
  const checksum = hash2.slice(0, 4);
  const total = Buffer.concat([addressBytes, checksum]);
  return encodeBase58(total);
}

export class WalletGenerator {
  static generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });

    const rawPrivateKey = crypto.randomBytes(32);
    const privateKeyHex = rawPrivateKey.toString('hex');

    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(rawPrivateKey);
    const uncompressedPubKey = ecdh.getPublicKey();

    const rawPubKey = uncompressedPubKey.slice(1);

    const ethHash = crypto.createHash('sha3-256').update(rawPubKey).digest();
    const ethAddress = '0x' + ethHash.slice(-20).toString('hex');

    const tronHash = crypto.createHash('sha3-256').update(rawPubKey).digest();
    const tronAddressBytes = Buffer.concat([Buffer.from([0x41]), tronHash.slice(-20)]);
    const tronAddress = base58CheckEncode(tronAddressBytes);

    return {
      ethereum: {
        address: ethAddress,
        privateKey: privateKeyHex
      },
      tron: {
        address: tronAddress,
        privateKey: privateKeyHex
      }
    };
  }
}
