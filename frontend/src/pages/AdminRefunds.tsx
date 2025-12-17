import { useState, useEffect } from 'react';
import api from '../api/api';

interface RefundData {
    id: string;
    amount: string;
    reason: string;
    status: string;
    adminNotes: string | null;
    createdAt: string;
    processedAt: string | null;
    user: { id: string; email: string };
    order: { id: string; orderNumber: string; total: string };
    payment: { razorpayPaymentId: string | null };
}

export default function AdminRefunds() {
    const [refunds, setRefunds] = useState<RefundData[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [adminNotesMap, setAdminNotesMap] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchRefunds();
    }, [filter]);

    const fetchRefunds = async () => {
        try {
            const params = filter ? `?status=${filter}` : '';
            const res = await api.get(`/refunds/admin${params}`);
            setRefunds(res.data.data);
        } catch (err) {
            console.error('Failed to fetch refunds');
        } finally {
            setLoading(false);
        }
    };

    const handleNotesChange = (refundId: string, value: string) => {
        setAdminNotesMap(prev => ({ ...prev, [refundId]: value }));
    };

    const processRefund = async (refundId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessing(refundId);
        try {
            await api.post(`/refunds/${refundId}/process`, {
                action,
                adminNotes: adminNotesMap[refundId] || ''
            });
            setAdminNotesMap(prev => {
                const updated = { ...prev };
                delete updated[refundId];
                return updated;
            });
            fetchRefunds();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to process refund');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            REQUESTED: 'badge-yellow',
            APPROVED: 'badge-green',
            REJECTED: 'badge-red',
            PROCESSED: 'badge-blue',
        };
        return styles[status] || 'badge-gray';
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
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Manage Refunds</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Refunds</option>
                    <option value="REQUESTED">Pending Request</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PROCESSED">Processed</option>
                </select>
            </div>

            {refunds.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <p className="text-gray-500">No refund requests found.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {refunds.map((refund) => (
                                    <tr key={refund.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">#{refund.order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {refund.user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            ₹{refund.amount}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={refund.reason}>
                                            {refund.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${getStatusBadge(refund.status)}`}>
                                                {refund.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(refund.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {refund.status === 'REQUESTED' && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Admin notes..."
                                                        value={adminNotesMap[refund.id] || ''}
                                                        onChange={(e) => handleNotesChange(refund.id, e.target.value)}
                                                        className="input text-sm py-1 w-full"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => processRefund(refund.id, 'APPROVE')}
                                                            disabled={processing === refund.id}
                                                            className="btn btn-success btn-sm flex-1"
                                                        >
                                                            {processing === refund.id ? '...' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => processRefund(refund.id, 'REJECT')}
                                                            disabled={processing === refund.id}
                                                            className="btn btn-danger btn-sm flex-1"
                                                        >
                                                            {processing === refund.id ? '...' : 'Reject'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {refund.adminNotes && (
                                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                    <span className="font-medium">Note:</span> {refund.adminNotes}
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
