import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Building2,
    Loader2,
    Save,
    Check,
    AlertCircle
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function Settings() {
    const { currentUser, userData, businessData, businessId } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Profile form
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: ''
    });

    // Business form
    const [businessFormData, setBusinessFormData] = useState({
        name: '',
        phone: '',
        address: '',
        currency: 'USD'
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (userData) {
            setProfileData({
                displayName: userData.displayName || currentUser?.displayName || '',
                email: currentUser?.email || ''
            });
        }
        if (businessData) {
            setBusinessFormData({
                name: businessData.name || '',
                phone: businessData.phone || '',
                address: businessData.address || '',
                currency: businessData.currency || 'USD'
            });
        }
    }, [userData, businessData, currentUser]);

    const showMessage = (type, message) => {
        if (type === 'success') {
            setSuccess(message);
            setError('');
        } else {
            setError(message);
            setSuccess('');
        }
        setTimeout(() => {
            setSuccess('');
            setError('');
        }, 3000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: profileData.displayName
            });

            // Update email if changed
            if (profileData.email !== currentUser.email) {
                await updateEmail(auth.currentUser, profileData.email);
            }

            // Update Firestore user document
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: profileData.displayName,
                email: profileData.email,
                updatedAt: serverTimestamp()
            });

            showMessage('success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateBusiness = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const businessRef = doc(db, 'businesses', businessId);
            await updateDoc(businessRef, {
                ...businessFormData,
                updatedAt: serverTimestamp()
            });
            showMessage('success', 'Business settings updated');
        } catch (error) {
            console.error('Error updating business:', error);
            showMessage('error', 'Failed to update business settings');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await updatePassword(auth.currentUser, passwordData.newPassword);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            showMessage('success', 'Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error);
            showMessage('error', error.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'business', label: 'Business', icon: Building2 },
        { id: 'security', label: 'Security', icon: SettingsIcon },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and business settings</p>
            </div>

            {/* Messages */}
            {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                    <Check className="w-5 h-5" />
                    <p className="text-sm">{success}</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs Sidebar */}
                <div className="lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-violet-50 text-violet-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={profileData.displayName}
                                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Business Tab */}
                    {activeTab === 'business' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Settings</h2>
                            <form onSubmit={handleUpdateBusiness} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                    <input
                                        type="text"
                                        value={businessFormData.name}
                                        onChange={(e) => setBusinessFormData({ ...businessFormData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={businessFormData.phone}
                                        onChange={(e) => setBusinessFormData({ ...businessFormData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        value={businessFormData.address}
                                        onChange={(e) => setBusinessFormData({ ...businessFormData, address: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 resize-none"
                                        placeholder="123 Business St, City, Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <select
                                        value={businessFormData.currency}
                                        onChange={(e) => setBusinessFormData({ ...businessFormData, currency: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="PKR">PKR (₨)</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
