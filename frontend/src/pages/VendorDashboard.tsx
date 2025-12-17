import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface VendorData {
    id: string;
    legalName: string;
    businessType: string;
    verificationStatus: string;
    store: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

interface DashboardStats {
    products: number;
    orders: number;
    revenue: number;
}

export default function VendorDashboard() {
    const [vendor, setVendor] = useState<VendorData | null>(null);
    const [stats, setStats] = useState<DashboardStats>({ products: 0, orders: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVendor();
    }, []);

    const fetchVendor = async () => {
        try {
            const vendorRes = await api.get('/vendors/me');
            const vendorData = vendorRes.data.data;
            setVendor(vendorData);

            // Only fetch stats if user is a valid vendor
            if (vendorData) {
                const [productsRes, ordersRes] = await Promise.all([
                    api.get('/products/vendor').catch(() => ({ data: { data: [] } })),
                    api.get('/vendor-orders').catch(() => ({ data: { data: [] } })),
                ]);

                const products = productsRes.data.data || [];
                const orders = ordersRes.data.data || [];
                const revenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.vendorTotal || 0), 0);

                setStats({
                    products: products.length,
                    orders: orders.length,
                    revenue,
                });
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setVendor(null);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Vendor</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Register your business and start selling on our platform
                </p>
                <Link to="/vendor/register" className="btn btn-primary">
                    Register as Vendor
                </Link>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            PENDING: 'badge-yellow',
            APPROVED: 'badge-green',
            REJECTED: 'badge-red',
        };
        return styles[status] || 'badge-gray';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vendor.store?.name || vendor.legalName}</h1>
                    <p className="text-gray-500 mt-1">{vendor.businessType}</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <span className={`badge ${getStatusBadge(vendor.verificationStatus)}`}>
                        {vendor.verificationStatus}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Products</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.products}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.orders}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">₹{stats.revenue.toFixed(2)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <Link to="/vendor/products" className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Products</p>
                                <p className="text-xs text-gray-500">Manage inventory</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/vendor/products/new" className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Add Product</p>
                                <p className="text-xs text-gray-500">List new item</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/vendor/orders" className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Orders</p>
                                <p className="text-xs text-gray-500">View & manage</p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/profile" className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Settings</p>
                                <p className="text-xs text-gray-500">Account settings</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
