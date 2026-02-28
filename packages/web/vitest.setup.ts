import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Setup DOM environment before all tests
beforeAll(() => {

  // OWASP A04:2025 Insecure Design - Mock ResizeObserver for Radix UI components
  // @radix-ui/react-use-size requires ResizeObserver API
  if (!global.ResizeObserver) {
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as any;
  }

  // Mock localStorage
  // Mitigation for testing environment - provide localStorage mock for Zustand persist middleware
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString()
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      get length() {
        return Object.keys(store).length
      },
      key: (index: number) => {
        const keys = Object.keys(store)
        return keys[index] || null
      },
    }
  })()

  // Define localStorage on global scope
  if (typeof global !== 'undefined') {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  }

  // Also define on window if it exists
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: localStorageMock,
      writable: true,
    })
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear localStorage between tests
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
