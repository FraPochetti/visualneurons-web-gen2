# Task: Set Up Unit Testing Infrastructure

## Priority: 🟢 LOW (but important)
**Estimated Time:** 4 hours
**Dependencies:** 
- Core features implemented (Phases 1-3)
**Owner:** [Assign]

## Problem Statement
No testing infrastructure exists. Need comprehensive unit tests for critical paths, especially payment flows and credit operations.

## Acceptance Criteria
- [ ] Jest and React Testing Library configured
- [ ] Test utilities and mocks created
- [ ] Critical paths have >80% coverage
- [ ] CI/CD integration for test runs
- [ ] Test documentation created

## Technical Implementation

### 1. Install Testing Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @types/jest jest-environment-jsdom
npm install --save-dev @testing-library/react-hooks
npm install --save-dev msw # For API mocking
```

### 2. Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 3. Test Setup File
```typescript
// jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/test/mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Auth: {
    currentAuthenticatedUser: jest.fn(),
    signOut: jest.fn(),
  },
  API: {
    graphql: jest.fn(),
  },
}))
```

### 4. Test Utilities
```typescript
// src/test/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { CreditProvider } from '@/src/contexts/CreditContext'

interface TestProviderProps {
  children: React.ReactNode
  authValue?: any
  creditValue?: any
}

function TestProviders({ children, authValue, creditValue }: TestProviderProps) {
  return (
    <AuthProvider value={authValue}>
      <CreditProvider value={creditValue}>
        {children}
      </CreditProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    authValue?: any
    creditValue?: any
  }
) => {
  const { authValue, creditValue, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders authValue={authValue} creditValue={creditValue}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }
```

### 5. Mock Service Worker Setup
```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  // Mock credit operations
  rest.post('/api/credits/check', (req, res, ctx) => {
    return res(
      ctx.json({
        balance: 100,
        sufficient: true,
      })
    )
  }),

  rest.post('/api/credits/deduct', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        newBalance: 95,
      })
    )
  }),

  // Mock Stripe
  rest.post('/api/create-checkout-session', (req, res, ctx) => {
    return res(
      ctx.json({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      })
    )
  }),

  // Mock AI operations
  rest.post('/api/generate-image', (req, res, ctx) => {
    return res(
      ctx.json({
        imageUrl: 'https://example.com/generated-image.jpg',
        credits: 5,
      })
    )
  }),
]

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### 6. Critical Path Tests

#### Credit Operations Test
```typescript
// src/hooks/__tests__/useCredits.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useCredits } from '../useCredits'
import { server } from '@/src/test/mocks/server'
import { rest } from 'msw'

describe('useCredits', () => {
  it('should fetch initial credit balance', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCredits())
    
    expect(result.current.loading).toBe(true)
    
    await waitForNextUpdate()
    
    expect(result.current.loading).toBe(false)
    expect(result.current.credits).toEqual({
      balance: 100,
      freeCredits: 10,
      paidCredits: 90,
    })
  })

  it('should handle credit deduction', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCredits())
    
    await waitForNextUpdate()
    
    await act(async () => {
      const success = await result.current.deductCredits(5)
      expect(success).toBe(true)
    })
    
    expect(result.current.credits.balance).toBe(95)
  })

  it('should handle insufficient credits', async () => {
    server.use(
      rest.post('/api/credits/check', (req, res, ctx) => {
        return res(ctx.json({ balance: 2, sufficient: false }))
      })
    )
    
    const { result, waitForNextUpdate } = renderHook(() => useCredits())
    await waitForNextUpdate()
    
    await act(async () => {
      const success = await result.current.deductCredits(5)
      expect(success).toBe(false)
    })
    
    expect(result.current.error).toBe('Insufficient credits')
  })
})
```

#### Payment Flow Test
```typescript
// src/components/__tests__/CreditPackageCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@/src/test/utils/test-utils'
import { CreditPackageCard } from '../CreditPackageCard'
import { loadStripe } from '@stripe/stripe-js'

jest.mock('@stripe/stripe-js')

describe('CreditPackageCard', () => {
  const mockPackage = {
    id: 'pkg_1',
    name: 'Starter Pack',
    credits: 50,
    price: 4.99,
    description: 'Perfect for beginners',
  }

  beforeEach(() => {
    (loadStripe as jest.Mock).mockResolvedValue({
      redirectToCheckout: jest.fn().mockResolvedValue({ error: null }),
    })
  })

  it('should render package details', () => {
    render(
      <CreditPackageCard 
        package={mockPackage}
        userId="user_123"
        userEmail="test@example.com"
      />
    )
    
    expect(screen.getByText('Starter Pack')).toBeInTheDocument()
    expect(screen.getByText('50 Credits')).toBeInTheDocument()
    expect(screen.getByText('$4.99')).toBeInTheDocument()
  })

  it('should handle purchase flow', async () => {
    render(
      <CreditPackageCard 
        package={mockPackage}
        userId="user_123"
        userEmail="test@example.com"
      />
    )
    
    const purchaseButton = screen.getByText('Purchase')
    fireEvent.click(purchaseButton)
    
    expect(purchaseButton).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(loadStripe).toHaveBeenCalled()
    })
  })

  it('should handle purchase errors', async () => {
    (loadStripe as jest.Mock).mockResolvedValue({
      redirectToCheckout: jest.fn().mockResolvedValue({ 
        error: { message: 'Payment failed' } 
      }),
    })
    
    render(
      <CreditPackageCard 
        package={mockPackage}
        userId="user_123"
        userEmail="test@example.com"
      />
    )
    
    fireEvent.click(screen.getByText('Purchase'))
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Payment failed. Please try again.')
    })
  })
})
```

### 7. Integration Tests
```typescript
// src/__tests__/integration/image-generation.test.tsx
import { render, screen, fireEvent, waitFor } from '@/src/test/utils/test-utils'
import GenerateImage from '@/pages/generate-image'
import { server } from '@/src/test/mocks/server'
import { rest } from 'msw'

describe('Image Generation Flow', () => {
  it('should complete full generation flow', async () => {
    render(<GenerateImage />, {
      creditValue: { balance: 100 }
    })
    
    // Fill in prompt
    const promptInput = screen.getByLabelText('Describe your image')
    fireEvent.change(promptInput, { 
      target: { value: 'A beautiful sunset' } 
    })
    
    // Select provider
    const providerSelect = screen.getByLabelText('AI Provider')
    fireEvent.change(providerSelect, { 
      target: { value: 'stability' } 
    })
    
    // Submit form
    const generateButton = screen.getByText('Generate Image')
    fireEvent.click(generateButton)
    
    // Check loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    
    // Wait for result
    await waitFor(() => {
      expect(screen.getByAltText('Generated image')).toBeInTheDocument()
    })
    
    // Verify credits were deducted
    expect(screen.getByText('95 credits')).toBeInTheDocument()
  })
})
```

## NPM Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Testing Guidelines
1. **Test naming**: Use descriptive names that explain what is being tested
2. **AAA Pattern**: Arrange, Act, Assert
3. **Mock external dependencies**: Don't make real API calls
4. **Test user interactions**: Not implementation details
5. **Keep tests focused**: One concept per test

## Next Steps
1. Add E2E tests with Cypress/Playwright
2. Implement visual regression testing
3. Add performance testing
4. Create test data factories 