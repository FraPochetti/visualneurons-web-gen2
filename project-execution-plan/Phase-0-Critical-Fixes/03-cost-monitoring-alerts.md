# Task: Set Up Cost Monitoring Alerts

## Priority: 🔴 CRITICAL - PRIORITY 2  
**Estimated Time:** 4 hours (revised - need real API cost tracking)
**Dependencies:** Error handling (Task 02) must be completed first
**Owner:** [Assign]
**Status:** ⏳ **BLOCKED** - Waiting for error handling completion

## Problem Statement  
We have no visibility into ACTUAL AI API costs - currently using rough estimates. We could accumulate thousands of dollars in charges before noticing. Need real-time cost tracking and immediate alerting when costs spike.

## CRITICAL CHANGE: Track Real API Costs, Not Estimates

## Acceptance Criteria
- [ ] CloudWatch dashboard showing AI operation costs
- [ ] Email alerts when hourly costs exceed $50
- [ ] Daily cost summary reports
- [ ] Per-provider cost breakdown
- [ ] User activity tracking for cost attribution

## Technical Implementation

### 1. Add Cost Tracking to Lambda
```typescript
// amplify/functions/aiDispatcher/costTracker.ts
interface OperationCost {
  provider: string;
  operation: string;
  estimatedCost: number;
}

// Rough cost estimates (update with actual pricing)
const OPERATION_COSTS: Record<string, Record<string, number>> = {
  replicate: {
    generateImage: 0.0052,      // ~$0.0052 per image
    upscaleImage: 0.0104,       // ~$0.0104 per upscale
    styleTransfer: 0.0156,      // ~$0.0156 per transfer
    outpaint: 0.0208,           // ~$0.0208 per outpaint
    inpaint: 0.0156,            // ~$0.0156 per inpaint
  },
  stability: {
    generateImage: 0.0020,      // ~$0.002 per image
    upscaleImage: 0.0060,       // ~$0.006 per upscale
    styleTransfer: 0.0080,      // ~$0.008 per transfer
    outpaint: 0.0100,           // ~$0.010 per outpaint
    inpaint: 0.0080,            // ~$0.008 per inpaint
  },
  gemini: {
    generateImage: 0.0025,      // ~$0.0025 per image
    // Add other operations as supported
  }
};

export async function trackOperationCost(
  userId: string,
  provider: string,
  operation: string,
  success: boolean
): Promise<void> {
  const cost = OPERATION_COSTS[provider]?.[operation] || 0.01; // Default cost
  
  // Send metric to CloudWatch
  await cloudwatch.putMetricData({
    Namespace: 'VisualNeurons/AI',
    MetricData: [{
      MetricName: 'OperationCost',
      Value: cost,
      Unit: 'None',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Provider', Value: provider },
        { Name: 'Operation', Value: operation },
        { Name: 'Success', Value: success.toString() }
      ]
    }]
  }).promise();
  
  // Log for detailed analysis
  logger.info('Operation cost tracked', {
    userId,
    provider,
    operation,
    cost,
    success,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Update Lambda Handler
```typescript
// amplify/functions/aiDispatcher/handler.ts
export const handler = async (event: any) => {
  const userId = event.identity?.claims?.sub || 'anonymous';
  const operation = event.arguments.operation;
  const providerName = event.arguments.provider || "replicate";
  let success = false;
  
  try {
    // ... existing operation code ...
    success = true;
    return result;
  } catch (error) {
    // ... error handling ...
    throw error;
  } finally {
    // Always track cost, even for failures
    await trackOperationCost(userId, providerName, operation, success);
  }
};
```

### 3. Create CloudWatch Dashboard
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "VisualNeurons/AI", "OperationCost", { "stat": "Sum", "period": 3600 } ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Hourly AI Costs ($)",
        "yAxis": {
          "left": {
            "label": "Cost ($)"
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "VisualNeurons/AI", "OperationCost", { "stat": "Sum" }, { "id": "m1" } ],
          [ { "expression": "RATE(m1)", "label": "Cost Rate", "id": "e1" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Cost Rate ($/hour)"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "VisualNeurons/AI", "OperationCost", "Provider", "replicate", { "stat": "Sum" } ],
          [ "...", "stability", { "stat": "Sum" } ],
          [ "...", "gemini", { "stat": "Sum" } ]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Cost by Provider"
      }
    }
  ]
}
```

### 4. Set Up CloudWatch Alarms
```typescript
// infrastructure/monitoring.ts
import { Alarm, Metric } from '@aws-cdk/aws-cloudwatch';
import { SnsAction } from '@aws-cdk/aws-cloudwatch-actions';
import { Topic } from '@aws-cdk/aws-sns';
import { EmailSubscription } from '@aws-cdk/aws-sns-subscriptions';

// Create SNS topic for alerts
const alertTopic = new Topic(stack, 'CostAlertTopic', {
  topicName: 'visualneurons-cost-alerts'
});

alertTopic.addSubscription(
  new EmailSubscription('alerts@yourdomain.com')
);

// Hourly cost alarm
new Alarm(stack, 'HourlyCostAlarm', {
  metric: new Metric({
    namespace: 'VisualNeurons/AI',
    metricName: 'OperationCost',
    statistic: 'Sum',
    period: Duration.hours(1),
  }),
  threshold: 50,  // $50 per hour
  evaluationPeriods: 1,
  alarmDescription: 'Alert when hourly AI costs exceed $50',
});

// Daily cost alarm
new Alarm(stack, 'DailyCostAlarm', {
  metric: new Metric({
    namespace: 'VisualNeurons/AI',
    metricName: 'OperationCost',
    statistic: 'Sum',
    period: Duration.days(1),
  }),
  threshold: 500,  // $500 per day
  evaluationPeriods: 1,
  alarmDescription: 'Alert when daily AI costs exceed $500',
});
```

### 5. Create Cost Report Lambda
```typescript
// amplify/functions/costReporter/handler.ts
export const handler = async (event: any) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get metrics from CloudWatch
  const params = {
    MetricDataQueries: [
      {
        Id: 'totalCost',
        MetricStat: {
          Metric: {
            Namespace: 'VisualNeurons/AI',
            MetricName: 'OperationCost',
            Dimensions: []
          },
          Period: 86400,  // 24 hours
          Stat: 'Sum'
        }
      },
      // Add queries for each provider
    ],
    StartTime: yesterday,
    EndTime: new Date()
  };
  
  const data = await cloudwatch.getMetricData(params).promise();
  
  // Format and send report
  const report = formatCostReport(data);
  await ses.sendEmail({
    Destination: { ToAddresses: ['admin@yourdomain.com'] },
    Message: {
      Subject: { Data: `Daily Cost Report - ${yesterday.toDateString()}` },
      Body: { Html: { Data: report } }
    },
    Source: 'noreply@yourdomain.com'
  }).promise();
};
```

## Testing Plan
1. Generate test operations with known costs
2. Verify metrics appear in CloudWatch within 5 minutes
3. Test alarm triggers by generating high-cost operations
4. Confirm email alerts are received
5. Validate daily report accuracy

## Immediate Actions Required
1. **Update email addresses** in alerts and reports
2. **Calibrate cost estimates** with actual API pricing
3. **Set appropriate thresholds** based on budget
4. **Enable CloudWatch Logs Insights** for deeper analysis

## Notes
- Cost estimates are rough - update with actual provider pricing
- Consider adding per-user cost tracking in Phase 1
- May need to adjust alarm thresholds based on usage patterns
- Remember to add cost data to user analytics in Phase 4 