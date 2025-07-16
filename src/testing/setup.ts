import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Global test utilities and mocks
Object.defineProperty(global, 'CSS', {
  value: { supports: () => false },
  writable: true,
});

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
});

// Mock localStorage with working implementation
const createStorageMock = () => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
});

// Mock Angular Fire Auth
vi.mock('@angular/fire/auth', () => ({
  Auth: vi.fn(),
  authState: vi.fn(),
  idToken: vi.fn(),
  user: vi.fn(),
}));

// Mock Angular Fire Firestore
vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  collection: vi.fn(),
  collectionData: vi.fn(),
  doc: vi.fn(),
  docData: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn(),
}));

// Mock rxfire/auth
vi.mock('rxfire/auth', () => ({
  default: {},
  authState: vi.fn(),
  idToken: vi.fn(), 
  user: vi.fn(),
}));

