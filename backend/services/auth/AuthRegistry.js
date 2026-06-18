class AuthRegistry {
  constructor() {
    this.drivers = new Map();
    this.activeDriver = null;
  }

  register(name, driverClass) {
    this.drivers.set(name, driverClass);
    console.log(`Registered Auth Driver: ${name}`);
  }

  initialize(activeDriverName, config) {
    if (!this.drivers.has(activeDriverName)) {
      throw new Error(`Auth driver "${activeDriverName}" is not registered.`);
    }
    const DriverClass = this.drivers.get(activeDriverName);
    this.activeDriver = new DriverClass(config);
    console.log(`Initialized Active Auth Driver: ${activeDriverName}`);
    return this.activeDriver;
  }

  getActive() {
    if (!this.activeDriver) {
      throw new Error("AuthRegistry has not been initialized yet.");
    }
    return this.activeDriver;
  }
}

export const authRegistry = new AuthRegistry();
