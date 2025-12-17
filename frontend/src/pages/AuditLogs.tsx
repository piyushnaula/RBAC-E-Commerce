import { useState, useEffect } from 'react';
import api from '../api/api';

interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    entity: string;
    entityId: string | null;
    oldValue: string | null;
    newValue: string | null;
    ipAddress: string | null;
    createdAt: string;
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [entityFilter, setEntityFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [entityFilter]);

    const fetchLogs = async () => {
        try {
            const params = entityFilter ? `?entity=${entityFilter}` : '';
            const res = await api.get(`/audit${params}`);
            setLogs(res.data.data);
        } catch (err) {
            console.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('APPROVED')) return 'badge-green';
        if (action.includes('REJECTED')) return 'badge-red';
        if (action.includes('REQUESTED')) return 'badge-yellow';
        return 'badge-blue';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">System Audit Logs</h1>
                <select
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Entities</option>
                    <option value="Refund">Refunds</option>
                    <option value="Order">Orders</option>
                    <option value="User">Users</option>
                </select>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No audit logs found.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {log.entity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {log.entityId?.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                                            {log.newValue && (
                                                <div className="bg-gray-50 p-2 rounded max-w-xs overflow-auto max-h-20">
                                                    {log.newValue}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
