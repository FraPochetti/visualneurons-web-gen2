import { PutItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});
const tableName = process.env.OPERATION_LOG_TABLE as string;

export interface OperationLogEntry {
    identityId: string;
    userSub?: string;
    provider: string;
    operation: string;
    model: string;
    status: 'SUCCESS' | 'ERROR';
    requestId?: string;
    costUsd: number;
    createdAt: string; // ISO
}

export async function writeOperationLog(entry: OperationLogEntry): Promise<void> {
    if (!tableName) return; // fail open if not configured
    await ddb.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            identityId: { S: entry.identityId },
            createdAt: { S: entry.createdAt },
            provider: { S: entry.provider },
            operation: { S: entry.operation },
            model: { S: entry.model },
            status: { S: entry.status },
            requestId: entry.requestId ? { S: entry.requestId } : { NULL: true },
            costUsd: { N: String(entry.costUsd) },
        }
    }));
}


