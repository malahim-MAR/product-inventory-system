import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    ImagePlus,
    Save,
    Sparkles,
    Minimize2,
    Check,
    RefreshCw
} from 'lucide-react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { generateProductDescription } from '../../lib/aiGenerator';
import { compressImage, formatFileSize } from '../../lib/imageCompressor';

const initialFormState = {
    name: '',
    description: '',
    sku: '',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '10',
    category: '',
    imageUrl: '',
    isActive: true
};

export default function Products() {
    const { businessId } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [error, setError] = useState('');

    // AI & Compression states
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [compressionStats, setCompressionStats] = useState(null);
    const [aiOptions, setAiOptions] = useState({
        tone: 'professional',
        length: 'medium'
    });

    useEffect(() => {
        if (businessId) {
            fetchProducts();
        }
    }, [businessId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('businessId', '==', businessId));
            const snapshot = await getDocs(q);

            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // AI Description Generator
    const handleGenerateDescription = async () => {
        if (!formData.name) {
            setError('Please enter a product name first');
            return;
        }

        setGeneratingDescription(true);
        setError('');

        try {
            const description = await generateProductDescription(
                formData.name,
                formData.category,
                aiOptions
            );
            setFormData(prev => ({ ...prev, description }));
        } catch (error) {
            console.error('Error generating description:', error);
            setError('Failed to generate description. Please try again.');
        } finally {
            setGeneratingDescription(false);
        }
    };

    // Image Compression Handler
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if image needs compression (> 500KB)
        if (file.size > 500 * 1024) {
            setCompressing(true);
            try {
                const result = await compressImage(file, {
                    maxWidth: 1200,
                    maxHeight: 1200,
                    quality: 0.8,
                    format: 'image/jpeg'
                });

                setImageFile(result.file);
                setImagePreview(result.preview);
                setCompressionStats({
                    originalSize: formatFileSize(result.originalSize),
                    compressedSize: formatFileSize(result.compressedSize),
                    savings: result.savings
                });
            } catch (error) {
                console.error('Compression error:', error);
                // Use original if compression fails
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
                setCompressionStats(null);
            } finally {
                setCompressing(false);
            }
        } else {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setCompressionStats(null);
        }
    };

    const uploadImage = async (file) => {
        const storageRef = ref(storage, `products/${businessId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            let imageUrl = formData.imageUrl;

            // Upload new image if selected
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const productData = {
                businessId,
                name: formData.name,
                description: formData.description,
                sku: formData.sku,
                price: parseFloat(formData.price) || 0,
                costPrice: parseFloat(formData.costPrice) || 0,
                stock: parseInt(formData.stock) || 0,
                lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
                category: formData.category,
                imageUrl,
                isActive: formData.isActive,
                updatedAt: serverTimestamp()
            };

            if (editingProduct) {
                // Update existing product
                const productRef = doc(db, 'products', editingProduct.id);
                await updateDoc(productRef, productData);
            } else {
                // Create new product
                await addDoc(collection(db, 'products'), {
                    ...productData,
                    createdAt: serverTimestamp()
                });
            }

            // Reset form and refresh
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            setError('Failed to save product. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            sku: product.sku || '',
            price: product.price?.toString() || '',
            costPrice: product.costPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            lowStockThreshold: product.lowStockThreshold?.toString() || '10',
            category: product.category || '',
            imageUrl: product.imageUrl || '',
            isActive: product.isActive !== false
        });
        setImagePreview(product.imageUrl || '');
        setShowModal(true);
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await deleteDoc(doc(db, 'products', productId));
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            setError('Failed to delete product');
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview('');
        setShowModal(false);
        setError('');
        setCompressionStats(null);
    };

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStockStatus = (product) => {
        if (product.stock <= 0) return { label: 'Out of Stock', color: 'red' };
        if (product.stock <= (product.lowStockThreshold || 10)) return { label: 'Low Stock', color: 'amber' };
        return { label: 'In Stock', color: 'emerald' };
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your product inventory</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                />
            </div>

            {/* Products List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Get started by adding your first product'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => {
                                    const stockStatus = getStockStatus(product);
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{product.sku || '-'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">${product.price?.toFixed(2) || '0.00'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{product.stock || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                                                    {stockStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredProducts.map((product) => {
                            const stockStatus = getStockStatus(product);
                            return (
                                <div key={product.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
                                                </div>
                                                <span className={`shrink-0 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${stockStatus.color}-100 text-${stockStatus.color}-700`}>
                                                    {stockStatus.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="font-medium text-gray-900">${product.price?.toFixed(2)}</span>
                                                    <span className="text-gray-500">Stock: {product.stock || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Image Upload with Compression */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 relative">
                                        {compressing ? (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                                            </div>
                                        ) : null}
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImagePlus className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="image-upload"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <ImagePlus className="w-4 h-4" />
                                            Upload Image
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (auto-compressed)</p>

                                        {/* Compression Stats */}
                                        {compressionStats && (
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                                <Minimize2 className="w-3 h-3 text-emerald-600" />
                                                <span className="text-emerald-600 font-medium">
                                                    Compressed: {compressionStats.originalSize} → {compressionStats.compressedSize}
                                                </span>
                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                    -{compressionStats.savings}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="e.g., SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="e.g., Electronics"
                                    />
                                </div>
                            </div>

                            {/* AI Description Generator */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <div className="flex items-center gap-2">
                                        {/* AI Options */}
                                        <select
                                            value={aiOptions.tone}
                                            onChange={(e) => setAiOptions({ ...aiOptions, tone: e.target.value })}
                                            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400"
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="luxury">Luxury</option>
                                            <option value="friendly">Friendly</option>
                                        </select>
                                        <select
                                            value={aiOptions.length}
                                            onChange={(e) => setAiOptions({ ...aiOptions, length: e.target.value })}
                                            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400"
                                        >
                                            <option value="short">Short</option>
                                            <option value="medium">Medium</option>
                                            <option value="long">Long</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleGenerateDescription}
                                            disabled={generatingDescription || !formData.name}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            {generatingDescription ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            AI Generate
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all resize-none"
                                    placeholder="Product description... (or use AI Generate)"
                                />
                            </div>

                            {/* Pricing & Stock */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                                    <input
                                        type="number"
                                        name="costPrice"
                                        value={formData.costPrice}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={formData.lowStockThreshold}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all"
                                        placeholder="10"
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active (visible in catalog)
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
