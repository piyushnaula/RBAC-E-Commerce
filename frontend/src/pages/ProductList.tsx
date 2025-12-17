import { useState, useEffect } from 'react';
import api from '../api/api';

interface Product {
    id: string;
    title: string;
    slug: string;
    description: string;
    basePrice: string;
    isActive: boolean;
    inventory: { quantity: number } | null;
    images: { url: string }[];
    store: { name: string };
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data);
        } catch (err) {
            console.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to add items to cart');
            return;
        }

        setAddingToCart(productId);
        try {
            await api.post('/cart/items', { productId, quantity: 1 });
            alert('Added to cart!');
        } catch (err: any) {
            console.error('Failed to add to cart:', err);
        } finally {
            setAddingToCart(null);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

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
                <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Products</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 w-full sm:w-64"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No products found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="card group hover:shadow-lg transition-shadow">
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                {product.images[0] ? (
                                    <img
                                        src={product.images[0].url}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-gray-500 mb-1">{product.store.name}</p>
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-blue-600">₹{product.basePrice}</span>
                                    <span className={`text-xs ${product.inventory && product.inventory.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {product.inventory && product.inventory.quantity > 0 ? `${product.inventory.quantity} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => addToCart(product.id)}
                                    disabled={addingToCart === product.id || !product.inventory || product.inventory.quantity === 0}
                                    className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingToCart === product.id ? (
                                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    )}
                                    {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
