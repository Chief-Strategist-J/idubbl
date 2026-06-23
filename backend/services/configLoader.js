import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';

dotenv.config();

const configPath = path.resolve(process.cwd(), 'config.yaml');

let config = {};

try {
  const fileContents = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(fileContents);
} catch (e) {
  console.error(`Error loading config.yaml: ${e.message}. Using environment variables or defaults.`);
}

// Override settings with environment variables if present
if (process.env.PORT) config.app.port = parseInt(process.env.PORT, 10);
if (process.env.APP_URL) config.app.url = process.env.APP_URL;

if (process.env.BETTER_AUTH_SECRET && config.auth?.providers?.['better-auth']) {
  config.auth.providers['better-auth'].secret = process.env.BETTER_AUTH_SECRET;
}

if (process.env.MONGODB_URI && config.auth?.providers?.['better-auth']?.database) {
  config.auth.providers['better-auth'].database.url = process.env.MONGODB_URI;
}

if (process.env.FLW_SECRET_KEY && config.payments?.gateways?.flutterwave) {
  config.payments.gateways.flutterwave.secretKey = process.env.FLW_SECRET_KEY;
}
if (process.env.FLW_PUBLIC_KEY && config.payments?.gateways?.flutterwave) {
  config.payments.gateways.flutterwave.publicKey = process.env.FLW_PUBLIC_KEY;
}
if (process.env.FLW_ENCRYPTION_KEY && config.payments?.gateways?.flutterwave) {
  config.payments.gateways.flutterwave.encryptionKey = process.env.FLW_ENCRYPTION_KEY;
}

// Dynamically construct payment callback URLs
const paymentBackendUrl = process.env.BACKEND_URL || process.env.BETTER_AUTH_URL || 'http://localhost:5000';
if (config.payments?.gateways?.flutterwave) {
  config.payments.gateways.flutterwave.redirectUrl = `${paymentBackendUrl}/api/payment/callback/flutterwave`;
}

if (process.env.JUSPAY_API_KEY && config.payments?.gateways?.juspay) {
  config.payments.gateways.juspay.apiKey = process.env.JUSPAY_API_KEY;
}
if (process.env.JUSPAY_MERCHANT_ID && config.payments?.gateways?.juspay) {
  config.payments.gateways.juspay.merchantId = process.env.JUSPAY_MERCHANT_ID;
}
if (config.payments?.gateways?.juspay) {
  config.payments.gateways.juspay.returnUrl = `${paymentBackendUrl}/api/payment/callback/juspay`;
}

if (process.env.ACTIVE_PAYMENT_GATEWAY) {
  config.payments.active = process.env.ACTIVE_PAYMENT_GATEWAY;
}

if (process.env.NOWPAYMENTS_API_KEY && config.payments?.gateways?.nowpayments) {
  config.payments.gateways.nowpayments.apiKey = process.env.NOWPAYMENTS_API_KEY;
}

export default config;
