import React, { useState, useEffect } from 'react';
import {
    Globe,
    Copy,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
    Check,
    Palette,
    Link as LinkIcon
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';

const THEMES = [
    { id: 'default', name: 'Default', primary: '#8b5cf6', secondary: '#f3f4f6' },
    { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#f0f9ff' },
    { id: 'forest', name: 'Forest', primary: '#22c55e', secondary: '#f0fdf4' },
    { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#fff7ed' },
    { id: 'midnight', name: 'Midnight', primary: '#6366f1', secondary: '#eef2ff' },
];

export default function PublicCatalog() {
    const { businessId, businessData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [products, setProducts] = useState([]);
    const [settings, setSettings] = useState({
        isPublic: false,
        slug: '',
        theme: 'default'
    });

    useEffect(() => {
        if (businessData?.catalogSettings) {
            setSettings(businessData.catalogSettings);
        }
        if (businessId) {
            fetchProducts();
        }
    }, [businessData, businessId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const productsRef = collection(db, 'products');
            const q = query(
                productsRef,
                where('businessId', '==', businessId),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const catalogUrl = `${window.location.origin}/catalog/${settings.slug || businessId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(catalogUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const businessRef = doc(db, 'businesses', businessId);
            await updateDoc(businessRef, {
                catalogSettings: settings,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublic = async () => {
        const newSettings = { ...settings, isPublic: !settings.isPublic };
        setSettings(newSettings);

        try {
            const businessRef = doc(db, 'businesses', businessId);
            await updateDoc(businessRef, {
                catalogSettings: newSettings,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error toggling public status:', error);
            setSettings(settings); // Revert on error
        }
    };

    const selectedTheme = THEMES.find(t => t.id === settings.theme) || THEMES[0];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Public Catalog</h1>
                <p className="text-gray-500 mt-1">Share your products with customers</p>
            </div>

            {/* Catalog Status Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.isPublic ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            {settings.isPublic ? (
                                <Eye className="w-6 h-6 text-emerald-600" />
                            ) : (
                                <EyeOff className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Catalog is {settings.isPublic ? 'Public' : 'Private'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {settings.isPublic
                                    ? 'Anyone with the link can view your products'
                                    : 'Only you can see your catalog'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleTogglePublic}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${settings.isPublic
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-violet-600 text-white hover:bg-violet-700'
                            }`}
                    >
                        {settings.isPublic ? 'Make Private' : 'Make Public'}
                    </button>
                </div>

                {/* Catalog Link */}
                {settings.isPublic && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-600 truncate">{catalogUrl}</span>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shrink-0"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <a
                                href={catalogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* URL Slug */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-600" />
                        Custom URL
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catalog Slug</label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{window.location.origin}/catalog/</span>
                            <input
                                type="text"
                                value={settings.slug}
                                onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                placeholder="my-store"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Only lowercase letters, numbers, and hyphens</p>
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-violet-600" />
                        Catalog Theme
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => setSettings({ ...settings, theme: theme.id })}
                                className={`group relative aspect-square rounded-lg border-2 transition-all ${settings.theme === theme.id
                                        ? 'border-violet-500 ring-2 ring-violet-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <div
                                    className="absolute inset-2 rounded"
                                    style={{ backgroundColor: theme.primary }}
                                />
                                {settings.theme === theme.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white drop-shadow" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Selected: <span className="font-medium">{selectedTheme.name}</span>
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                </button>
            </div>

            {/* Catalog Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Catalog Preview</h3>
                    <p className="text-sm text-gray-500">
                        {products.length} active product{products.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No active products to display</p>
                    </div>
                ) : (
                    <div
                        className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                        style={{ backgroundColor: selectedTheme.secondary }}
                    >
                        {products.slice(0, 8).map(product => (
                            <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                                <div className="aspect-square bg-gray-100">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Globe className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                    <p className="font-bold mt-1" style={{ color: selectedTheme.primary }}>
                                        ${product.price?.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
