import { useState, useEffect } from 'react';
import api from '../api/api';

interface VendorOrder {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    createdAt: string;
    user: { email: string };
    payment: { status: string } | null;
    vendorItems: {
        id: string;
        title: string;
        quantity: number;
        price: string;
    }[];
    vendorTotal: number;
}

export default function VendorOrders() {
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const fetchOrders = async () => {
        try {
            const params = filter ? `?status=${filter}` : '';
            const res = await api.get(`/vendor-orders${params}`);
            setOrders(res.data.data);
        } catch (err) {
            console.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            await api.patch(`/vendor-orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
        } catch (err: any) {
            if (err.response?.status !== 401) {
                alert(err.response?.data?.message || 'Failed to update status');
            }
        } finally {
            setUpdating(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            PENDING: 'badge-yellow',
            CONFIRMED: 'badge-blue',
            PROCESSING: 'badge-purple',
            SHIPPED: 'badge-blue',
            DELIVERED: 'badge-green',
            CANCELLED: 'badge-red',
            REFUNDED: 'badge-gray',
        };
        return styles[status] || 'badge-gray';
    };

    const getPaymentBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            CAPTURED: 'badge-green',
            PENDING: 'badge-yellow',
            FAILED: 'badge-red',
            REFUNDED: 'badge-gray',
        };
        return styles[status] || 'badge-gray';
    };

    const getNextStatuses = (status: string): string[] => {
        const transitions: { [key: string]: string[] } = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['SHIPPED', 'CANCELLED'],
            SHIPPED: ['DELIVERED'],
        };
        return transitions[status] || [];
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
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Vendor Orders</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Orders</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="card p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                                        <span className={`badge ${getStatusBadge(order.status)}`}>
                                            {order.status}
                                        </span>
                                        {/* Payment Status Badge */}
                                        <span className={`badge ${getPaymentBadge(order.payment?.status || 'PENDING')}`}>
                                            Payment: {order.payment?.status || 'PENDING'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Customer: {order.user.email} • {new Date(order.createdAt).toLocaleDateString()}
                                    </p>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">Your Items</p>
                                        {order.vendorItems.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm py-1">
                                                <span>{item.title} × {item.quantity}</span>
                                                <span className="font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                                            <span>Your Total</span>
                                            <span className="text-blue-600">₹{order.vendorTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {getNextStatuses(order.status).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(order.id, status)}
                                            disabled={updating === order.id}
                                            className={`btn btn-sm ${status === 'CANCELLED' ? 'btn-danger' : 'btn-primary'
                                                }`}
                                        >
                                            {updating === order.id ? '...' : `Mark ${status}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
