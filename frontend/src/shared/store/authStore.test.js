import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from './authStore.js';

describe('Auth Store tests', () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false, sessionChecked: false });
    
    // Stub localStorage
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    // Reset mocks
    vi.restoreAllMocks();
  });

  it('should start with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login demo user correctly', async () => {
    const mockUser = { id: 'u1', firstName: 'Alex', lastName: 'Storm', email: 'alex@demo.com', role: 'player' };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: vi.fn(() => null) },
      json: async () => ({ user: mockUser }),
    });

    const result = await useAuthStore.getState().login('alex@demo.com', 'any-password');
    expect(result.success).toBe(true);
    expect(result.role).toBe('player');
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('alex@demo.com');
  });

  it('should fail on invalid user email', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const result = await useAuthStore.getState().login('invalid@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should signup a new user correctly', async () => {
    const mockUser = { id: 'u_new', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'player' };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: vi.fn(() => null) },
      json: async () => ({ user: mockUser }),
    });

    const data = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '12345678' };
    const result = await useAuthStore.getState().signup(data);
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.firstName).toBe('John');
    expect(state.user.role).toBe('player');
  });

  it('should logout correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Pre-set logged in state
    useAuthStore.setState({ user: { email: 'alex@demo.com' }, isAuthenticated: true });
    
    await useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
