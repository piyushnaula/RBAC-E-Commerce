import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface CartItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        basePrice: string;
        images: { url: string }[];
        inventory: { quantity: number } | null;
    };
}

export default function Cart() {
    const [cart, setCart] = useState<{ items: CartItem[]; subtotal: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart');
            setCart(res.data.data);
        } catch (err) {
            console.error('Failed to fetch cart');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        setUpdating(itemId);
        try {
            await api.patch(`/cart/items/${itemId}`, { quantity });
            fetchCart();
        } catch (err: any) {
            if (err.response?.status === 404) {
                fetchCart();
            } else if (err.response?.status !== 401) {
                alert(err.response?.data?.message || 'Failed to update quantity');
            }
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (itemId: string) => {
        setUpdating(itemId);
        try {
            await api.delete(`/cart/items/${itemId}`);
            fetchCart();
        } catch (err: any) {
            if (err.response?.status === 404) {
                fetchCart();
            } else if (err.response?.status !== 401) {
                alert(err.response?.data?.message || 'Failed to remove item');
            }
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6">Start shopping to add items to your cart</p>
                <Link to="/products" className="btn btn-primary">
                    Browse Products
                </Link>
            </div>
        );
    }

    const subtotal = parseFloat(cart.subtotal);
    const tax = subtotal * 0.18;
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + shipping;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item) => (
                        <div key={item.id} className="card p-4 flex gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.product.images[0] ? (
                                    <img
                                        src={item.product.images[0].url}
                                        alt={item.product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                                <p className="text-lg font-bold text-blue-600 mt-1">₹{item.product.basePrice}</p>

                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={updating === item.id || item.quantity <= 1}
                                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            -
                                        </button>
                                        <span className="px-4 py-1 border-x">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            disabled={updating === item.id}
                                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        disabled={updating === item.id}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                    ₹{(parseFloat(item.product.basePrice) * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-24">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (18% GST)</span>
                                <span className="font-medium">₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                                </span>
                            </div>
                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/checkout" className="btn btn-primary w-full mt-6 py-3">
                            Proceed to Checkout
                        </Link>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Free shipping on orders above ₹500
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
