import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Check,
    Zap,
    Crown,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        productLimit: 25,
        orderLimit: 50,
        features: [
            'Up to 25 products',
            'Up to 50 orders/month',
            'Basic catalog',
            'Email support'
        ],
        icon: Zap,
        popular: false
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 9.99,
        productLimit: 100,
        orderLimit: 500,
        features: [
            'Up to 100 products',
            'Up to 500 orders/month',
            'Custom catalog themes',
            'Priority support',
            'Stock alerts'
        ],
        icon: CreditCard,
        popular: true
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 29.99,
        productLimit: -1,
        orderLimit: -1,
        features: [
            'Unlimited products',
            'Unlimited orders',
            'All themes',
            'Priority support',
            'Advanced analytics',
            'API access',
            'White-label catalog'
        ],
        icon: Crown,
        popular: false
    }
];

export default function Billing() {
    const { businessId, businessData } = useAuth();
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [error, setError] = useState('');

    const currentPlanId = businessData?.planId || 'free';

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const plansRef = collection(db, 'plans');
            const snapshot = await getDocs(plansRef);

            if (!snapshot.empty) {
                const plansData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Merge with defaults for icons
                const mergedPlans = DEFAULT_PLANS.map(defaultPlan => {
                    const dbPlan = plansData.find(p => p.id === defaultPlan.id);
                    return dbPlan ? { ...defaultPlan, ...dbPlan } : defaultPlan;
                });
                setPlans(mergedPlans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (planId) => {
        if (planId === currentPlanId) return;

        setSelectedPlan(planId);
        setUpgrading(true);
        setError('');

        try {
            // In a real app, you would integrate with a payment provider here (Stripe, etc.)
            // For MVP, we just update the plan directly
            const businessRef = doc(db, 'businesses', businessId);
            await updateDoc(businessRef, {
                planId: planId,
                planExpiresAt: null, // Would be set after payment
                updatedAt: serverTimestamp()
            });

            // Refresh the page to get updated businessData
            window.location.reload();
        } catch (error) {
            console.error('Error updating plan:', error);
            setError('Failed to update plan. Please try again.');
        } finally {
            setUpgrading(false);
            setSelectedPlan(null);
        }
    };

    const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Billing & Plan</h1>
                <p className="text-gray-500 mt-1">Manage your subscription</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-violet-200 text-sm font-medium">Current Plan</p>
                        <h2 className="text-2xl font-bold mt-1">{currentPlan.name}</h2>
                        <p className="text-violet-200 mt-2">
                            {currentPlan.productLimit === -1 ? 'Unlimited' : currentPlan.productLimit} products •
                            {currentPlan.orderLimit === -1 ? ' Unlimited' : ` ${currentPlan.orderLimit}`} orders/month
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">
                            ${currentPlan.price}
                            <span className="text-lg font-normal text-violet-200">/mo</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const PlanIcon = plan.icon || CreditCard;
                        const isCurrentPlan = plan.id === currentPlanId;
                        const isUpgrading = upgrading && selectedPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-xl border-2 p-6 transition-all ${isCurrentPlan
                                        ? 'border-violet-500 shadow-lg shadow-violet-100'
                                        : 'border-gray-100 hover:border-violet-200'
                                    } ${plan.popular ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrentPlan ? 'bg-violet-100' : 'bg-gray-100'
                                        }`}>
                                        <PlanIcon className={`w-5 h-5 ${isCurrentPlan ? 'text-violet-600' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                        {isCurrentPlan && (
                                            <span className="text-xs text-violet-600 font-medium">Current Plan</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                                    <span className="text-gray-500">/month</span>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={isCurrentPlan || upgrading}
                                    className={`w-full py-2.5 rounded-lg font-medium transition-colors ${isCurrentPlan
                                            ? 'bg-violet-100 text-violet-700 cursor-default'
                                            : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50'
                                        }`}
                                >
                                    {isUpgrading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : isCurrentPlan ? (
                                        'Current Plan'
                                    ) : plan.price > currentPlan.price ? (
                                        'Upgrade'
                                    ) : (
                                        'Downgrade'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Billing Notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This is a demo billing page. In production, this would integrate with Stripe or another payment provider for secure transactions.
                </p>
            </div>
        </div>
    );
}
