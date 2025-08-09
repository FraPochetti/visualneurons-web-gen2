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
    const [providerFilter, setProviderFilter] = useState('all');
    const [operationFilter, setOperationFilter] = useState('all');
    const [sinceDays, setSinceDays] = useState(30);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
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
    }, [sinceDays]);

    const filtered = useMemo(() => {
        return rows.filter(r => (
            (providerFilter === 'all' || r.provider === providerFilter) &&
            (operationFilter === 'all' || r.operation === operationFilter)
        ));
    }, [rows, providerFilter, operationFilter]);

    const totals = useMemo(() => {
        const total = filtered.reduce((acc, r) => acc + (r.costUsd || 0), 0);
        const byDay = new Map<string, number>();
        for (const r of filtered) {
            const day = r.createdAt.slice(0, 10);
            byDay.set(day, (byDay.get(day) || 0) + (r.costUsd || 0));
        }
        const daily = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
        return { total, daily };
    }, [filtered]);

    return (
        <div style={{ padding: 24 }}>
            <h1>My Usage</h1>
            {error && <div style={{ color: '#b00', marginBottom: 12 }}>Error: {error}</div>}
            <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <label>
                        Range:
                        <select value={sinceDays} onChange={(e) => setSinceDays(Number(e.target.value))} style={{ marginLeft: 6 }}>
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={90}>90 days</option>
                        </select>
                    </label>
                </div>
                <div>
                    <label>
                        Provider:
                        <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} style={{ marginLeft: 6 }}>
                            <option value="all">All</option>
                            <option value="replicate">replicate</option>
                            <option value="stability">stability</option>
                            <option value="gemini">gemini</option>
                        </select>
                    </label>
                </div>
                <div>
                    <label>
                        Operation:
                        <select value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)} style={{ marginLeft: 6 }}>
                            <option value="all">All</option>
                            <option value="generateImage">generateImage</option>
                            <option value="upscaleImage">upscaleImage</option>
                            <option value="styleTransfer">styleTransfer</option>
                            <option value="outpaint">outpaint</option>
                            <option value="inpaint">inpaint</option>
                        </select>
                    </label>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <strong>Total:</strong> ${totals.total.toFixed(4)}
                </div>
                <span style={{ marginLeft: 12 }}>
                    <a
                        href={URL.createObjectURL(new Blob([
                            'date,provider,operation,model,status,costUsd\n',
                            ...filtered.map(r => [r.createdAt, r.provider, r.operation, r.model, r.status, r.costUsd ?? 0].join(','))
                        ], { type: 'text/csv' }))}
                        download={`usage-${new Date().toISOString().slice(0, 10)}.csv`}
                    >
                        Download CSV
                    </a>
                </span>
            </div>
            {loading ? (
                <div>Loading…</div>
            ) : filtered.length === 0 ? (
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
                        {filtered.map((r, i) => (
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

            {totals.daily.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h3>Daily totals</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Day</th>
                                <th style={{ textAlign: 'right' }}>Total (USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totals.daily.map(([day, sum]) => (
                                <tr key={day}>
                                    <td>{day}</td>
                                    <td style={{ textAlign: 'right' }}>${sum.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


