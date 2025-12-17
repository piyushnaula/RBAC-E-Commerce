import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Address {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
}

interface CartItem {
    id: string;
    quantity: number;
    product: {
        title: string;
        basePrice: string;
    };
}

export default function Checkout() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [cart, setCart] = useState<{ items: CartItem[]; subtotal: string } | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
    });
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        loadRazorpayScript();
    }, []);

    const loadRazorpayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

    const fetchData = async () => {
        try {
            const [cartRes, addressRes] = await Promise.all([
                api.get('/cart'),
                api.get('/orders/addresses/list'),
            ]);
            setCart(cartRes.data.data);
            setAddresses(addressRes.data.data);

            const defaultAddr = addressRes.data.data.find((a: Address) => a.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            }
        } catch (err: any) {
            setError('Failed to load checkout data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/orders/addresses', { ...newAddress, isDefault: addresses.length === 0 });
            setAddresses([...addresses, res.data.data]);
            setSelectedAddressId(res.data.data.id);
            setShowAddressForm(false);
            setNewAddress({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '' });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add address');
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert('Please select a delivery address');
            return;
        }

        setPlacing(true);
        setError('');

        try {
            // Step 1: Create order
            const orderRes = await api.post('/orders', { addressId: selectedAddressId });
            const order = orderRes.data.data;

            // Step 2: Create Razorpay payment order
            const paymentRes = await api.post('/payments/create-order', { orderId: order.id });
            const paymentData = paymentRes.data.data;

            // Step 3: Open Razorpay checkout
            const options = {
                key: paymentData.keyId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                name: 'RBAC E-Commerce',
                description: `Order #${paymentData.orderNumber}`,
                order_id: paymentData.razorpayOrderId,
                handler: async function (response: any) {
                    try {
                        // Step 4: Verify payment
                        await api.post('/payments/verify', {
                            orderId: order.id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        alert(`Payment successful! Order #${paymentData.orderNumber}`);
                        navigate('/orders');
                    } catch (err: any) {
                        setError('Payment verification failed');
                    }
                },
                prefill: {
                    email: '',
                },
                theme: {
                    color: '#2563eb', // Blue-600
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process order');
        } finally {
            setPlacing(false);
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
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <a href="/products" className="btn btn-primary">Browse Products</a>
            </div>
        );
    }

    const subtotal = parseFloat(cart.subtotal);
    const tax = subtotal * 0.18;
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + shipping;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Address */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="text-blue-600 text-sm font-medium hover:text-blue-700"
                        >
                            {showAddressForm ? 'Cancel' : '+ Add New'}
                        </button>
                    </div>

                    {showAddressForm ? (
                        <form onSubmit={handleAddAddress} className="card p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="input" placeholder="Full Name *" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} required />
                                <input className="input" placeholder="Phone *" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                            </div>
                            <input className="input" placeholder="Address Line 1 *" value={newAddress.addressLine1} onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })} required />
                            <input className="input" placeholder="Address Line 2" value={newAddress.addressLine2} onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })} />
                            <div className="grid grid-cols-3 gap-4">
                                <input className="input" placeholder="City *" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
                                <input className="input" placeholder="State *" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} required />
                                <input className="input" placeholder="Postal Code *" value={newAddress.postalCode} onChange={e => setNewAddress({ ...newAddress, postalCode: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Save Address</button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {addresses.length > 0 ? (
                                addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={`card p-4 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <strong className="text-gray-900">{addr.fullName}</strong>
                                            {addr.isDefault && <span className="badge badge-green">Default</span>}
                                        </div>
                                        <p className="text-gray-600 text-sm">{addr.addressLine1}</p>
                                        {addr.addressLine2 && <p className="text-gray-600 text-sm">{addr.addressLine2}</p>}
                                        <p className="text-gray-600 text-sm">{addr.city}, {addr.state} - {addr.postalCode}</p>
                                        <p className="text-gray-600 text-sm mt-1">Phone: {addr.phone}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No addresses saved. Please add one.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Order Summary */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                    <div className="card p-6 sticky top-24">
                        <div className="space-y-3 mb-6">
                            {cart.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.product.title} <span className="text-gray-400">× {item.quantity}</span></span>
                                    <span className="font-medium text-gray-900">₹{(parseFloat(item.product.basePrice) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (18% GST)</span>
                                <span className="font-medium text-gray-900">₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-900'}>
                                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between text-lg font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placing || !selectedAddressId}
                            className="btn btn-primary w-full mt-6 py-3 text-lg shadow-lg shadow-blue-200"
                        >
                            {placing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Pay & Place Order'}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Secure payment powered by Razorpay
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
