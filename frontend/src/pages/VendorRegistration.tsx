import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function VendorRegistration() {
    const [formData, setFormData] = useState({
        legalName: '',
        businessType: 'individual',
        taxId: '',
        phone: '',
        address: '',
        storeName: '',
        storeDescription: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/vendors', formData);
            alert('Vendor account created successfully!');
            navigate('/vendor/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create vendor account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Vendor</h1>
                <p className="text-gray-500">Join our marketplace and start selling to millions of customers</p>
            </div>

            <div className="card p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                            Business Details
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Business Name</label>
                                <input
                                    name="legalName"
                                    placeholder="e.g. Acme Corp Ltd."
                                    value={formData.legalName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="individual">Individual / Sole Proprietor</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="llc">LLC</option>
                                    <option value="corporation">Corporation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / GSTIN</label>
                                <input
                                    name="taxId"
                                    placeholder="Optional"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                                <input
                                    name="phone"
                                    placeholder="+91..."
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                                <input
                                    name="address"
                                    placeholder="Full registered address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                            Store Setup
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                <input
                                    name="storeName"
                                    placeholder="Your Public Store Name"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">This is the name customers will see.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                                <textarea
                                    name="storeDescription"
                                    placeholder="Tell customers about your store..."
                                    value={formData.storeDescription}
                                    onChange={handleChange}
                                    className="input min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-lg">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : 'Register & Start Selling'}
                        </button>
                        <p className="text-xs text-center text-gray-500 mt-4">
                            By registering, you agree to our Terms of Service and Vendor Agreement.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
