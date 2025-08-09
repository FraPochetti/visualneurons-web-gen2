import React, { useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '@/amplify/data/resource';

type OperationLog = {
    identityId: string;
    provider: string;
    operation: string;
    model: string;
    status: 'SUCCESS' | 'ERROR';
    requestId?: string;
    costUsd: number;
    createdAt: string;
};

const client = generateClient<Schema>();

export default function MyUsage() {
    const [rows, setRows] = useState<OperationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const identityId = (await fetchAuthSession()).identityId;
        if (!identityId) {
          setRows([]);
        } else {
          // Fetch OperationLog entries for this user; sort by createdAt desc
          const resp = await client.models.OperationLog.list({
            filter: {
              identityId: { eq: identityId },
            },
            // client-side sort after fetch for now
          });
          const items = (resp.data ?? []) as unknown as OperationLog[];
          const filtered = items
            .filter((r) => new Date(r.createdAt) >= since)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          setRows(filtered);
        }
            } catch (e: any) {
                setError(e.message || 'Failed to load usage');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totals = useMemo(() => {
        const total = rows.reduce((acc, r) => acc + (r.costUsd || 0), 0);
        return { total };
    }, [rows]);

    return (
        <div style={{ padding: 24 }}>
            <h1>My Usage</h1>
            {error && <div style={{ color: '#b00', marginBottom: 12 }}>Error: {error}</div>}
            <div style={{ marginBottom: 12 }}>
                <strong>Last 30 days total:</strong> ${totals.total.toFixed(4)}
            </div>
            {loading ? (
                <div>Loading…</div>
            ) : rows.length === 0 ? (
                <div>No usage yet.</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Date</th>
                            <th style={{ textAlign: 'left' }}>Provider</th>
                            <th style={{ textAlign: 'left' }}>Operation</th>
                            <th style={{ textAlign: 'left' }}>Model</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'right' }}>Cost (USD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <td>{new Date(r.createdAt).toLocaleString()}</td>
                                <td>{r.provider}</td>
                                <td>{r.operation}</td>
                                <td>{r.model}</td>
                                <td>{r.status}</td>
                                <td style={{ textAlign: 'right' }}>${(r.costUsd || 0).toFixed(4)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}


