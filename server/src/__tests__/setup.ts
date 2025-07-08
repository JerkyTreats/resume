// Test setup file for Jest configuration

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
process.exit = jest.fn() as any;

// Restore process.exit after all tests
afterAll(() => {
  process.exit = originalExit;
});

// Global test utilities
(global as any).testUtils = {
  createMockRequest: (body: any = {}) => ({
    body,
    query: {},
    params: {},
    headers: {},
    method: 'GET',
    url: '/test',
    originalUrl: '/test'
  }),

  createMockResponse: () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    return res;
  },

  createMockNext: () => jest.fn()
};

// Extend global types for test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockRequest: (body?: any) => any;
        createMockResponse: () => any;
        createMockNext: () => jest.Mock;
      };
    }
  }
}

// Make this file a module
export {};
