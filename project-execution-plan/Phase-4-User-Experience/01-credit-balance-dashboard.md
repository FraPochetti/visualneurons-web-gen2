# Task: Build Credit Balance Dashboard

## Priority: 🟠 MEDIUM
**Estimated Time:** 6 hours
**Dependencies:** 
- Credit System implemented (Phase 1)
- CSS Architecture complete (Phase 2)
**Owner:** [Assign]

## Problem Statement
Users have no visibility into their credit balance, usage history, or spending patterns. Need a comprehensive dashboard to show credit information.

## Acceptance Criteria
- [ ] Real-time credit balance display
- [ ] Transaction history with filtering
- [ ] Usage analytics and charts
- [ ] Quick purchase options
- [ ] Export functionality for records

## Technical Implementation

### 1. Dashboard Layout Component
```tsx
// pages/credit-dashboard.tsx
import { CreditOverview } from '@/src/components/dashboard/CreditOverview';
import { TransactionHistory } from '@/src/components/dashboard/TransactionHistory';
import { UsageAnalytics } from '@/src/components/dashboard/UsageAnalytics';
import { QuickPurchase } from '@/src/components/dashboard/QuickPurchase';

export default function CreditDashboard() {
  const { activeTab, setActiveTab } = useDashboardState();
  
  return (
    <Layout>
      <div className="dashboard-container">
        <h1 className="text-3xl font-bold mb-6">Credit Dashboard</h1>
        
        <CreditOverview />
        
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Transaction History
          </button>
          <button
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Usage Analytics
          </button>
          <button
            className={`tab ${activeTab === 'purchase' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchase')}
          >
            Buy Credits
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'history' && <TransactionHistory />}
          {activeTab === 'analytics' && <UsageAnalytics />}
          {activeTab === 'purchase' && <QuickPurchase />}
        </div>
      </div>
    </Layout>
  );
}
```

### 2. Credit Overview Component
```tsx
// src/components/dashboard/CreditOverview.tsx
export const CreditOverview: React.FC = () => {
  const { credits, loading, error } = useCredits();
  const { monthlySpend, weeklyAverage } = useSpendingStats();
  
  if (loading) return <CreditOverviewSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="credit-overview">
      <div className="overview-grid">
        <StatCard
          title="Current Balance"
          value={credits.balance}
          unit="credits"
          icon={<WalletIcon />}
          trend={credits.balance > 50 ? 'positive' : 'warning'}
        />
        
        <StatCard
          title="Free Credits"
          value={credits.freeCredits}
          unit="remaining"
          icon={<GiftIcon />}
        />
        
        <StatCard
          title="This Month"
          value={monthlySpend}
          unit="credits used"
          icon={<CalendarIcon />}
          trend={monthlySpend > weeklyAverage * 4 ? 'negative' : 'neutral'}
        />
        
        <StatCard
          title="Weekly Average"
          value={weeklyAverage}
          unit="credits/week"
          icon={<TrendIcon />}
        />
      </div>
      
      {credits.balance < 10 && (
        <LowBalanceWarning 
          balance={credits.balance}
          onPurchase={() => router.push('/pricing')}
        />
      )}
    </div>
  );
};
```

### 3. Transaction History Component
```tsx
// src/components/dashboard/TransactionHistory.tsx
export const TransactionHistory: React.FC = () => {
  const { 
    transactions, 
    loading, 
    hasMore, 
    loadMore,
    filters,
    setFilters 
  } = useTransactionHistory();
  
  return (
    <div className="transaction-history">
      <div className="history-header">
        <h3 className="text-xl font-semibold">Transaction History</h3>
        <TransactionFilters 
          filters={filters}
          onChange={setFilters}
        />
      </div>
      
      <div className="transaction-list">
        {transactions.map(transaction => (
          <TransactionItem 
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>
      
      {hasMore && (
        <button 
          onClick={loadMore}
          disabled={loading}
          className="btn btn-secondary w-full"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
      
      <ExportButton 
        transactions={transactions}
        format="csv"
      />
    </div>
  );
};
```

### 4. Usage Analytics Component
```tsx
// src/components/dashboard/UsageAnalytics.tsx
import { LineChart, BarChart, PieChart } from '@/src/components/charts';

export const UsageAnalytics: React.FC = () => {
  const { dailyUsage, providerBreakdown, operationStats } = useUsageAnalytics();
  
  return (
    <div className="usage-analytics">
      <div className="analytics-grid">
        <div className="chart-card">
          <h4>Daily Usage Trend</h4>
          <LineChart
            data={dailyUsage}
            xKey="date"
            yKey="credits"
            height={300}
          />
        </div>
        
        <div className="chart-card">
          <h4>Provider Distribution</h4>
          <PieChart
            data={providerBreakdown}
            dataKey="credits"
            nameKey="provider"
            height={300}
          />
        </div>
        
        <div className="chart-card">
          <h4>Operations Breakdown</h4>
          <BarChart
            data={operationStats}
            xKey="operation"
            yKey="count"
            height={300}
          />
        </div>
        
        <div className="insights-card">
          <h4>Insights</h4>
          <UsageInsights data={{ dailyUsage, providerBreakdown }} />
        </div>
      </div>
    </div>
  );
};
```

### 5. Custom Hooks for Dashboard
```typescript
// src/hooks/useDashboard.ts
export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: 'last30days',
    type: 'all',
    minAmount: undefined,
    maxAmount: undefined
  });
  
  const loadTransactions = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const response = await creditService.getTransactionHistory({
        limit: 20,
        nextToken: reset ? undefined : nextToken,
        filters
      });
      
      setTransactions(prev => 
        reset ? response.transactions : [...prev, ...response.transactions]
      );
      setNextToken(response.nextToken);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [nextToken, filters]);
  
  useEffect(() => {
    loadTransactions(true);
  }, [filters]);
  
  return {
    transactions,
    loading,
    hasMore: !!nextToken,
    loadMore: () => loadTransactions(false),
    filters,
    setFilters
  };
}

export function useUsageAnalytics() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await creditService.getUsageAnalytics(dateRange);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };
    
    loadAnalytics();
  }, [dateRange]);
  
  return {
    ...analytics,
    dateRange,
    setDateRange
  };
}
```

## Styling
```css
/* styles/dashboard.css */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard-tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.tab {
  padding: var(--space-3) var(--space-6);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab.active {
  border-bottom-color: var(--color-primary-500);
  color: var(--color-primary-500);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-6);
}

.chart-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
}
```

## Testing Plan
1. Test real-time balance updates
2. Verify transaction filtering works correctly
3. Test chart rendering with various data sets
4. Verify export functionality
5. Test responsive design on mobile
6. Performance test with large transaction history

## Next Steps
1. Add predictive analytics for credit usage
2. Implement budget alerts
3. Add comparison with other users (anonymized)
4. Create mobile app dashboard view 