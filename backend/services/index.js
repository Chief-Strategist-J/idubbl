import config from './configLoader.js';
import { authRegistry } from './auth/AuthRegistry.js';
import { BetterAuthDriver } from './auth/adapters/BetterAuthDriver.js';

import { paymentRegistry } from './payment/PaymentRegistry.js';
import { JuspayDriver } from './payment/adapters/JuspayDriver.js';
import { FlutterwaveDriver } from './payment/adapters/FlutterwaveDriver.js';

// 1. Register Auth Drivers
authRegistry.register('better-auth', BetterAuthDriver);

// 2. Register Payment Drivers
paymentRegistry.register('juspay', JuspayDriver);
paymentRegistry.register('flutterwave', FlutterwaveDriver);

// 3. Initialize active services from config
const activeAuthName = config.auth?.active || 'better-auth';
const authConfig = config.auth?.providers?.[activeAuthName] || {};
const authService = authRegistry.initialize(activeAuthName, authConfig);

const activePaymentName = config.payments?.active || 'juspay';
const paymentConfig = config.payments?.gateways?.[activePaymentName] || {};
const paymentService = paymentRegistry.initialize(activePaymentName, paymentConfig);

import { sendEmail } from './emailService.js';
import { blockchainService } from './blockchain/BlockchainService.js';

export {
  config,
  authRegistry,
  authService,
  paymentRegistry,
  paymentService,
  sendEmail,
  blockchainService,
};
