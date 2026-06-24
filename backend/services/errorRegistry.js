// Error Registry containing standard error responses with codes and messages
class ErrorRegistry {
  constructor() {
    this.errors = new Map();
    this.registerDefaults();
  }

  // Register a custom error code with a default HTTP status, client-facing message, and optional description
  register(code, status, message, description = '') {
    this.errors.set(code, { status, message, description });
  }

  registerDefaults() {
    // Authentication / Session errors
    this.register('UNAUTHORIZED', 412, 'Please log in to perform this action.');
    this.register('SESSION_EXPIRED', 401, 'Your session has expired. Please sign in again.');
    
    // Deposit / Payment validation errors
    this.register('INVALID_AMOUNT', 400, 'The specified amount is invalid or zero.');
    this.register('MISSING_TX_HASH', 400, 'Transaction hash is required to verify the payment.');
    this.register('USER_NOT_FOUND', 404, 'User account could not be found.');
    this.register('PENDING_TX_NOT_FOUND', 404, 'The requested transaction is not pending or does not exist.');

    // Withdrawal errors
    this.register('INSUFFICIENT_FUNDS', 400, 'You do not have enough available balance to perform this action.');
    this.register('INSUFFICIENT_WINNINGS', 400, 'You can only withdraw from your Winnings wallet. Your Winnings balance is insufficient.');
    this.register('MISSING_WITHDRAW_DETAILS', 400, 'Amount, destination address, and network are required.');

    // General errors
    this.register('DATABASE_ERROR', 500, 'A database error occurred. Please try again later.');
    this.register('SERVICE_ERROR', 500, 'External service failure. Please contact support.');
    this.register('UNKNOWN_ERROR', 500, 'An unexpected error occurred. Please try again.');
  }

  // Generate a consistent response payload for express routing
  send(res, code, customMessage = '', details = null) {
    const errorConfig = this.errors.get(code) || this.errors.get('UNKNOWN_ERROR');
    const responsePayload = {
      success: false,
      code,
      message: customMessage || errorConfig.message,
    };
    if (details) {
      responsePayload.details = details;
    }
    return res.status(errorConfig.status).json(responsePayload);
  }
}

export const errorRegistry = new ErrorRegistry();
