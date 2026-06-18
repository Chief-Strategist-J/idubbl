import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from './authStore.js';

describe('Auth Store tests', () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should start with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login demo user correctly', () => {
    const result = useAuthStore.getState().login('alex@demo.com', 'any-password');
    expect(result.success).toBe(true);
    expect(result.role).toBe('player');
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('alex@demo.com');
  });

  it('should fail on invalid user email', () => {
    const result = useAuthStore.getState().login('invalid@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should signup a new user correctly', () => {
    const data = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '12345678' };
    const result = useAuthStore.getState().signup(data);
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.firstName).toBe('John');
    expect(state.user.role).toBe('player');
  });

  it('should logout correctly', () => {
    // Pre-set logged in state
    useAuthStore.setState({ user: { email: 'alex@demo.com' }, isAuthenticated: true });
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
