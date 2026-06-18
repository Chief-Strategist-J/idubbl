import config from './configLoader.js';
import { authRegistry } from './auth/AuthRegistry.js';
import { BetterAuthDriver } from './auth/BetterAuthDriver.js';

import { paymentRegistry } from './payment/PaymentRegistry.js';
import { FlutterwaveDriver } from './payment/FlutterwaveDriver.js';
import { JuspayDriver } from './payment/JuspayDriver.js';

// 1. Register Auth Drivers
authRegistry.register('better-auth', BetterAuthDriver);

// 2. Register Payment Drivers
paymentRegistry.register('flutterwave', FlutterwaveDriver);
paymentRegistry.register('juspay', JuspayDriver);

// 3. Initialize active services from config
const activeAuthName = config.auth?.active || 'better-auth';
const authConfig = config.auth?.providers?.[activeAuthName] || {};
const authService = authRegistry.initialize(activeAuthName, authConfig);

const activePaymentName = config.payments?.active || 'flutterwave';
const paymentConfig = config.payments?.gateways?.[activePaymentName] || {};
const paymentService = paymentRegistry.initialize(activePaymentName, paymentConfig);

export {
  config,
  authRegistry,
  authService,
  paymentRegistry,
  paymentService,
};
