import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

interface Product {
    id: string;
    title: string;
    description: string | null;
    basePrice: string;
    sku: string;
    isActive: boolean;
    category: { id: string; name: string } | null;
    inventory: { quantity: number } | null;
}

export default function VendorProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products/vendor');
            setProducts(res.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Failed to load products');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/products/${productId}`);
            setProducts(products.filter(p => p.id !== productId));
        } catch (err: any) {
            if (err.response?.status !== 401) {
                alert(err.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const toggleActive = async (productId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/products/${productId}`, { isActive: !currentStatus });
            setProducts(products.map(p =>
                p.id === productId ? { ...p, isActive: !currentStatus } : p
            ));
        } catch (err: any) {
            if (err.response?.status !== 401) {
                alert(err.response?.data?.message || 'Failed to update product');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
                <Link to="/vendor/products/new" className="btn btn-primary">
                    + Add New Product
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h2>
                    <p className="text-gray-500 mb-6">Get started by creating your first product listing.</p>
                    <Link to="/vendor/products/new" className="btn btn-primary">
                        Create Product
                    </Link>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{product.title}</div>
                                            {product.category && <div className="text-xs text-gray-500">{product.category.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{product.sku}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{product.basePrice}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {product.inventory?.quantity ?? 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${product.isActive ? 'badge-green' : 'badge-red'}`}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => toggleActive(product.id, product.isActive)}
                                                className={`text-xs font-medium px-2 py-1 rounded ${product.isActive
                                                    ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                                                    : 'text-green-700 bg-green-50 hover:bg-green-100'
                                                    }`}
                                            >
                                                {product.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <Link
                                                to={`/vendor/products/edit/${product.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
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
