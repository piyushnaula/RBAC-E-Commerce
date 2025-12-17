import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import VendorRegistration from './pages/VendorRegistration';
import VendorDashboard from './pages/VendorDashboard';
import VendorProducts from './pages/VendorProducts';
import VendorOrders from './pages/VendorOrders';
import ProductForm from './pages/ProductForm';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import RequestRefund from './pages/RequestRefund';
import AdminRefunds from './pages/AdminRefunds';
import AuditLogs from './pages/AuditLogs';

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        window.location.reload();
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="text-xl font-bold text-blue-600">
                                RBAC Shop
                            </Link>
                            <div className="hidden md:flex space-x-4">
                                <Link
                                    to="/"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/products"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/products') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    Products
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {!token ? (
                                <>
                                    <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                        Login
                                    </Link>
                                    <Link to="/signup" className="btn btn-primary btn-sm">
                                        Sign Up
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/cart" className="text-gray-600 hover:text-gray-900 relative">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </Link>
                                    <Link to="/orders" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:block">
                                        Orders
                                    </Link>
                                    <Link to="/vendor/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:block">
                                        Vendor
                                    </Link>
                                    <Link to="/admin" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:block">
                                        Admin
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/admin/refunds" element={<AdminRefunds />} />
                    <Route path="/admin/audit" element={<AuditLogs />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/refunds" element={<RequestRefund />} />
                    <Route path="/vendor/register" element={<VendorRegistration />} />
                    <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor/products" element={<VendorProducts />} />
                    <Route path="/vendor/products/new" element={<ProductForm />} />
                    <Route path="/vendor/products/edit/:id" element={<ProductForm />} />
                    <Route path="/vendor/orders" element={<VendorOrders />} />
                </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
                    © 2026 RBAC E-Commerce Created by <a href="https://github.com/piyushnaula" target="_blank" rel="noopener noreferrer">Piyush Naula</a>
                </div>
            </footer>
        </div>
    );
}

export default App;
