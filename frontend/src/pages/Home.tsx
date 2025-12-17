import { Link } from 'react-router-dom';

export default function Home() {
    const token = localStorage.getItem('token');

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center py-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Welcome to RBAC Shop
                </h1>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                    A secure multi-vendor e-commerce platform with enterprise-grade Role-Based Access Control
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/products" className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                        Browse Products
                    </Link>
                    {!token && (
                        <Link to="/signup" className="btn bg-blue-500 text-white hover:bg-blue-400 px-8 py-3">
                            Get Started
                        </Link>
                    )}
                </div>
            </div>

            {/* Features */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Features</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="card p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Secure RBAC</h3>
                        <p className="text-gray-500 text-sm">
                            Enterprise-grade role-based access control for customers, vendors, and admins
                        </p>
                    </div>

                    <div className="card p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Razorpay Payments</h3>
                        <p className="text-gray-500 text-sm">
                            Secure payment processing with Razorpay integration and refund management
                        </p>
                    </div>

                    <div className="card p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Multi-Vendor</h3>
                        <p className="text-gray-500 text-sm">
                            Support for multiple vendors with individual stores and order management
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            {token && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Quick Links</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        <Link to="/orders" className="card p-4 hover:shadow-md transition-shadow">
                            <span className="font-medium text-gray-900">My Orders</span>
                            <p className="text-sm text-gray-500 mt-1">View order history</p>
                        </Link>
                        <Link to="/refunds" className="card p-4 hover:shadow-md transition-shadow">
                            <span className="font-medium text-gray-900">Refunds</span>
                            <p className="text-sm text-gray-500 mt-1">Request refunds</p>
                        </Link>
                        <Link to="/vendor/dashboard" className="card p-4 hover:shadow-md transition-shadow">
                            <span className="font-medium text-gray-900">Vendor Portal</span>
                            <p className="text-sm text-gray-500 mt-1">Manage your store</p>
                        </Link>
                        <Link to="/admin" className="card p-4 hover:shadow-md transition-shadow">
                            <span className="font-medium text-gray-900">Admin Panel</span>
                            <p className="text-sm text-gray-500 mt-1">System administration</p>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
