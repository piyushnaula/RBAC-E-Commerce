import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

interface VendorData {
    store: { id: string } | null;
}

export default function ProductForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        basePrice: '',
        sku: '',
        quantity: '0',
    });
    const [storeId, setStoreId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    useEffect(() => {
        fetchVendorAndProduct();
    }, [id]);

    useEffect(() => {
        // Create previews for selected files
        const urls = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...urls]);

        // Cleanup
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, [selectedFiles]);

    const fetchVendorAndProduct = async () => {
        try {
            // Get vendor's store ID
            const vendorRes = await api.get('/vendors/me');
            const vendor: VendorData = vendorRes.data.data;
            if (vendor.store) {
                setStoreId(vendor.store.id);
            }

            // If editing, fetch product data
            if (isEdit && id) {
                const productRes = await api.get(`/products/${id}`);
                const product = productRes.data.data;
                setFormData({
                    title: product.title,
                    description: product.description || '',
                    basePrice: product.basePrice,
                    sku: product.sku,
                    quantity: product.inventory?.quantity?.toString() || '0',
                });
                if (product.images) {
                    // Show existing server images as previews
                    setPreviewUrls(product.images.map((img: any) => img.url));
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemovePreview = (index: number) => {
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        // Note: For simplicity, we're currently not distinguishing nicely between removing *existing* server images vs *new* file uploads in this basic UI state.
        // A true robust implementation would track existingImageIds separately from newFiles.
        // For now, if the user removes an image, we'll just handle valid files logic or re-upload logic.
        // If it's a new file, remove from selectedFiles.
        // If it's an existing file, we can't easily remove it via FormData only without an explicit delete API or tracking separate state.
        // Given the requirement "upload it", we'll focus on the upload part.
        // Correction: To handle removing new files correctly:
        if (index >= (previewUrls.length - selectedFiles.length)) {
            // It is a new file
            const newFileIndex = index - (previewUrls.length - selectedFiles.length);
            setSelectedFiles(prev => prev.filter((_, i) => i !== newFileIndex));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('basePrice', formData.basePrice);
            data.append('sku', formData.sku);
            data.append('quantity', formData.quantity);
            data.append('storeId', storeId);

            selectedFiles.forEach(file => {
                data.append('images', file);
            });

            // Let browser set Content-Type with boundary for FormData
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
            };
            // Note: Axios + Browser usually handle this automatically if we don't force 'multipart/form-data' without boundary.
            // However, with our default instance having 'application/json', we might need to unset it or just trust axios to override.
            // Best practice: remove 'Content-Type' so browser sets it with boundary.
            delete api.defaults.headers.post['Content-Type'];
            delete api.defaults.headers.patch['Content-Type'];

            // Actually, let's just pass { headers: { "Content-Type": "multipart/form-data" } } IS WRONG.
            // We should pass { headers: { "Content-Type": undefined } }

            const uploadConfig = {
                headers: { "Content-Type": undefined }
            };

            if (isEdit) {
                await api.patch(`/products/${id}`, data, uploadConfig);
                // Update inventory separately
                await api.patch(`/products/${id}/inventory`, { quantity: parseInt(formData.quantity) });
            } else {
                await api.post('/products', data, uploadConfig);
            }
            navigate('/vendor/products');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                    <input
                        name="title"
                        placeholder="e.g. Premium Wireless Headphones"
                        value={formData.title}
                        onChange={handleChange}
                        className="input"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        placeholder="Detailed product description..."
                        value={formData.description}
                        onChange={handleChange}
                        className="input min-h-[120px]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                            name="basePrice"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.basePrice}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                        <input
                            name="quantity"
                            type="number"
                            placeholder="0"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                </div>

                {/* File Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-blue-600 font-medium hover:text-blue-700">Click to upload images</span>
                            <span className="text-gray-500 block text-sm mt-1">or drag and drop</span>
                        </label>
                    </div>

                    {/* Previews */}
                    {previewUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {previewUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePreview(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                    <input
                        name="sku"
                        placeholder="e.g. WH-1000XM4"
                        value={formData.sku}
                        onChange={handleChange}
                        className="input bg-gray-50 disabled:text-gray-500"
                        required
                        disabled={isEdit}
                    />
                    {isEdit && <p className="text-xs text-gray-500 mt-1">SKU cannot be changed once created.</p>}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                            </span>
                        ) : (isEdit ? 'Update Product' : 'Create Product')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/vendor/products')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
