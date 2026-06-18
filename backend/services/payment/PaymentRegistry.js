class PaymentRegistry {
  constructor() {
    this.drivers = new Map();
    this.activeDriver = null;
  }

  register(name, driverClass) {
    this.drivers.set(name, driverClass);
    console.log(`Registered Payment Driver: ${name}`);
  }

  initialize(activeDriverName, config) {
    if (!this.drivers.has(activeDriverName)) {
      throw new Error(`Payment driver "${activeDriverName}" is not registered.`);
    }
    const DriverClass = this.drivers.get(activeDriverName);
    this.activeDriver = new DriverClass(config);
    console.log(`Initialized Active Payment Driver: ${activeDriverName}`);
    return this.activeDriver;
  }

  getActive() {
    if (!this.activeDriver) {
      throw new Error("PaymentRegistry has not been initialized yet.");
    }
    return this.activeDriver;
  }
}

export const paymentRegistry = new PaymentRegistry();
