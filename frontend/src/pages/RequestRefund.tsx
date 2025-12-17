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
    order: {
        id: string;
        orderNumber: string;
        total: string;
    };
}

export default function RequestRefund() {
    const [orders, setOrders] = useState<any[]>([]);
    const [refunds, setRefunds] = useState<RefundData[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, refundsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/refunds'),
            ]);
            // Filter orders that are eligible for refund (delivered or recent)
            const eligibleOrders = ordersRes.data.data.filter(
                (o: any) => o.status === 'DELIVERED' || o.status === 'CONFIRMED'
            );
            setOrders(eligibleOrders);
            setRefunds(refundsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderId || reason.length < 10) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/refunds', { orderId: selectedOrderId, reason });
            setSuccess('Refund request submitted successfully!');
            setSelectedOrderId('');
            setReason('');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit refund request');
        } finally {
            setSubmitting(false);
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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Refund Center</h1>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{success}</div>}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Request Form */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request a Refund</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
                                <select
                                    value={selectedOrderId}
                                    onChange={(e) => setSelectedOrderId(e.target.value)}
                                    required
                                    className="input"
                                >
                                    <option value="">-- Choose an eligible order --</option>
                                    {orders.map((order) => (
                                        <option key={order.id} value={order.id}>
                                            #{order.orderNumber} - ₹{order.total} ({order.status})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Only Delivered or Confirmed orders are eligible.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Refund</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    minLength={10}
                                    placeholder="Please provide details about the issue..."
                                    className="input min-h-[120px]"
                                />
                                <p className="text-xs text-gray-500 mt-1">Min. 10 characters required.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedOrderId}
                                className="btn btn-primary w-full"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Refund History */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
                    {refunds.length === 0 ? (
                        <div className="card p-8 text-center text-gray-500 bg-gray-50">
                            No refund requests found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {refunds.map((refund) => (
                                <div key={refund.id} className="card p-4 transition-shadow hover:shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold text-gray-900 block">Order #{refund.order.orderNumber}</span>
                                            <span className="text-sm text-gray-500">{new Date(refund.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`badge ${getStatusBadge(refund.status)}`}>
                                            {refund.status}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-3">
                                        <p className="font-medium text-xs text-gray-500 uppercase mb-1">Reason</p>
                                        {refund.reason}
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-t pt-2">
                                        <span className="font-medium">Refund Amount</span>
                                        <span className="font-bold text-gray-900">₹{refund.amount}</span>
                                    </div>

                                    {refund.adminNotes && (
                                        <div className="mt-3 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                                            <span className="font-semibold text-blue-700">Admin Response:</span> {refund.adminNotes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
