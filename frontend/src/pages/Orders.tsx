import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface OrderItem {
    id: string;
    title: string;
    quantity: number;
    price: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    createdAt: string;
    items: OrderItem[];
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            setOrders(res.data.data);
        } catch (err) {
            console.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            PENDING: 'badge-yellow',
            CONFIRMED: 'badge-blue',
            PROCESSING: 'badge-purple',
            SHIPPED: 'badge-blue',
            DELIVERED: 'badge-green',
            CANCELLED: 'badge-red',
            REFUNDED: 'badge-gray',
        };
        return colors[status] || 'badge-gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h1>
                <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                <Link to="/products" className="btn btn-primary">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                    <div key={order.id} className="card p-6 h-full flex flex-col">
                        <div className="flex flex-col justify-between mb-4 pb-4 border-b border-gray-100">
                            <div className="mb-3">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                                    <span className={`badge ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ₹{order.total}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-grow">
                            {order.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700 truncate pr-2 max-w-[70%]">{item.title}</span>
                                    <span className="text-gray-500">x{item.quantity}</span>
                                </div>
                            ))}
                            {order.items.length > 3 && (
                                <p className="text-xs text-blue-600 font-medium pt-1">
                                    +{order.items.length - 3} more items
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
