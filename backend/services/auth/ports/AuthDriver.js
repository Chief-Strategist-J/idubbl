export class AuthDriver {
  constructor(config) {
    this.config = config;
  }

  // Handle direct API/Express requests (for callback routes, OAuth, etc.)
  handleRequest(req, res) {
    throw new Error("method handleRequest() must be implemented");
  }

  // Programmatic helper to get current session
  async getSession(req) {
    throw new Error("method getSession() must be implemented");
  }
}
