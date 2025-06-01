import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from "@aws-lambda-powertools/logger";

const logger = new Logger({ serviceName: 'rateLimit' });

interface RateLimitEntry {
    userId: string;
    windowStart: number;
    operations: number;
    ttl: number;
}

interface RateLimitError extends Error {
    retryAfter: number;
}

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.RATE_LIMIT_TABLE_NAME!;

const HOUR_IN_SECONDS = 3600;
const MAX_OPERATIONS_PER_HOUR = 10;
const ADMIN_OVERRIDE_USER_IDS = ['admin', 'test-user']; // Add admin user IDs here

export async function checkRateLimit(userId: string, operation: string): Promise<boolean> {
    // Allow admin override for testing
    if (ADMIN_OVERRIDE_USER_IDS.includes(userId)) {
        logger.info('Admin override for rate limit', { userId, operation });
        return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % HOUR_IN_SECONDS);

    try {
        // Check current window
        const entry = await getRateLimitEntry(userId, windowStart);

        if (entry && entry.operations >= MAX_OPERATIONS_PER_HOUR) {
            const error = new Error(`Rate limit exceeded. Maximum ${MAX_OPERATIONS_PER_HOUR} operations per hour. Try again later.`) as RateLimitError;
            error.retryAfter = HOUR_IN_SECONDS - (now % HOUR_IN_SECONDS);

            logger.warn('Rate limit exceeded', {
                userId,
                operation,
                currentOperations: entry.operations,
                maxOperations: MAX_OPERATIONS_PER_HOUR,
                retryAfter: error.retryAfter
            });

            throw error;
        }

        // Increment counter
        await incrementOperationCount(userId, windowStart, now + HOUR_IN_SECONDS * 2);

        logger.info('Rate limit check passed', {
            userId,
            operation,
            currentOperations: (entry?.operations || 0) + 1,
            maxOperations: MAX_OPERATIONS_PER_HOUR
        });

        return true;
    } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
            throw error;
        }

        logger.error('Error checking rate limit', {
            userId,
            operation,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        // On DynamoDB errors, allow the operation (fail open)
        return true;
    }
}

async function getRateLimitEntry(userId: string, windowStart: number): Promise<RateLimitEntry | null> {
    try {
        const response = await dynamoClient.send(new GetCommand({
            TableName: tableName,
            Key: {
                userId,
                windowStart
            }
        }));

        return response.Item as RateLimitEntry || null;
    } catch (error) {
        logger.error('Error getting rate limit entry', {
            userId,
            windowStart,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
}

async function incrementOperationCount(userId: string, windowStart: number, ttl: number): Promise<void> {
    try {
        await dynamoClient.send(new UpdateCommand({
            TableName: tableName,
            Key: {
                userId,
                windowStart
            },
            UpdateExpression: 'ADD operations :inc SET #ttl = :ttl',
            ExpressionAttributeNames: {
                '#ttl': 'ttl'
            },
            ExpressionAttributeValues: {
                ':inc': 1,
                ':ttl': ttl
            }
        }));
    } catch (error) {
        logger.error('Error incrementing operation count', {
            userId,
            windowStart,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Try to create a new entry if update failed
        try {
            await dynamoClient.send(new PutCommand({
                TableName: tableName,
                Item: {
                    userId,
                    windowStart,
                    operations: 1,
                    ttl
                },
                ConditionExpression: 'attribute_not_exists(userId)'
            }));
        } catch (putError) {
            logger.error('Error creating new rate limit entry', {
                userId,
                windowStart,
                error: putError instanceof Error ? putError.message : 'Unknown error'
            });
        }
    }
}

export function isRateLimitError(error: Error): error is RateLimitError {
    return error.message.includes('Rate limit exceeded');
} 