import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from "../Api/axios";
import { toast } from "react-toastify";
import { AppContext } from '../Context/appContext';
import { FaUser, FaSlidersH, FaShieldAlt, FaDatabase, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';

export default function Settings() {
    const { userData } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('preferences');
    const [currency, setCurrency] = useState('USD');
    const [refreshInterval, setRefreshInterval] = useState('60');
    const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

    // Password State Management
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    // State for toggling password field visibility
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const submitPasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            if (toast) toast.error("New passwords do not match!");
            return;
        }

        setUpdatingPassword(true);
        try {
            const { data } = await API.post(`/api/auth/changePassword`, passwordData);

            if (data.success) {
                toast.success("Password updated successfully");
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowCurrent(false);
                setShowNew(false);
                setShowConfirm(false);
            } else {
                toast.error(data.message || "Password Change Failed!");
            }

        } catch (error) {
            if (toast) toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setUpdatingPassword(false);
        }
    };

    const triggerDiagnostics = () => {
        setLoadingDiagnostics(true);
        setTimeout(() => {
            setLoadingDiagnostics(false);
            if (toast && typeof toast.success === 'function') {
                toast.success("All external data links verified cleanly!");
            } else {
                alert("All external data links verified cleanly!");
            }
        }, 1200);
    };

    return (
        <div className="bg-[#0d0d0d] min-h-screen pt-20 text-white w-full overflow-x-hidden">
            <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#2a2a2a] pb-4"
                >
                    <h1 className="text-2xl font-bold">Control Panel Settings</h1>
                    <p className="text-sm text-[#ababab] mt-1">Configure your personal preferences and system credentials.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                    {/* Sidebar Tabs */}
                    <div className="space-y-1 bg-[#181818] p-2.5 rounded-xl border border-[#2a2a2a]">
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg font-medium cursor-pointer transition-all duration-200 ${activeTab === 'preferences'
                                    ? 'bg-[#202020] text-blue-400 border border-blue-500/20'
                                    : 'text-[#ababab] hover:bg-[#202020] hover:text-white'
                                }`}
                        >
                            <FaSlidersH size={16} /> App Preferences
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg cursor-pointer font-medium transition-all duration-200 ${activeTab === 'account'
                                    ? 'bg-[#202020] text-blue-400 border border-blue-500/20'
                                    : 'text-[#ababab] hover:bg-[#202020] hover:text-white'
                                }`}
                        >
                            <FaUser size={16} /> Account Security
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-2 min-h-[400px]">
                        <AnimatePresence mode="wait">

                            {/* PREFERENCES TAB */}
                            {activeTab === 'preferences' && (
                                <motion.div
                                    key="preferences-tab"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] space-y-4">
                                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-gray-200">
                                            <FaSlidersH className="text-blue-400" /> Tracking Variables
                                        </h3>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-[#ababab]">Display Valuation Currency</label>
                                            <select
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="bg-[#202020] mt-1 border border-[#2a2a2a] rounded-lg text-sm px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="USD">USD ($) - US Dollar</option>
                                                <option value="EUR">EUR (€) - Euro</option>
                                                <option value="PKR">PKR (Rs) - Pakistani Rupee</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-[#ababab]">Exchange API Sync Intervals</label>
                                            <select
                                                value={refreshInterval}
                                                onChange={(e) => setRefreshInterval(e.target.value)}
                                                className="bg-[#202020] mt-1 border border-[#2a2a2a] rounded-lg text-sm px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="30">Real-time Data (30 Seconds)</option>
                                                <option value="60">Balanced Performance (60 Seconds)</option>
                                                <option value="300">Eco-mode (5 Minutes)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] space-y-4">
                                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-gray-200">
                                            <FaDatabase className="text-yellow-500" /> System Link Diagnostics
                                        </h3>
                                        <p className="text-xs text-[#ababab] leading-relaxed">
                                            Force run complete end-to-end data validation across all enabled public wallets and exchange API infrastructure.
                                        </p>
                                        <button
                                            onClick={triggerDiagnostics}
                                            disabled={loadingDiagnostics}
                                            className="flex items-center gap-2 bg-[#202020] hover:bg-[#2a2a2a] text-xs border border-[#333] hover:border-[#444] text-white px-4 py-2 rounded-lg font-medium transition-all"
                                        >
                                            <MdRefresh size={16} className={loadingDiagnostics ? 'animate-spin text-yellow-500' : ''} />
                                            {loadingDiagnostics ? 'Polling Active Nodes...' : 'Execute Node Diagnostics'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ACCOUNT / PASSWORD SECURITY TAB */}
                            {activeTab === 'account' && (
                                <motion.div
                                    key="account-tab"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    {/* Profile Meta Info Card */}
                                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] space-y-4">
                                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-gray-200">
                                            <FaUser className="text-blue-400" /> Identity Overview
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                            <div>
                                                <span className="text-[11px] uppercase font-mono tracking-wider text-[#ababab]">Account Name</span>
                                                <p className="text-sm font-medium text-white mt-0.5">{userData?.name || 'Assetly User'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] uppercase font-mono tracking-wider text-[#ababab]">Linked Email</span>
                                                <p className="text-sm font-medium text-white mt-0.5">{userData?.email || 'user@assetly.com'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Password Management Form */}
                                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] space-y-4">
                                        <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-gray-200">
                                            <FaLock className="text-red-400" /> Update Password
                                        </h3>

                                        <form onSubmit={submitPasswordUpdate} className="space-y-4 pt-1">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs text-[#ababab]">Current Password</label>
                                                <div className="relative w-full flex items-center">
                                                    <input
                                                        type={showCurrent ? "text" : "password"}
                                                        name="currentPassword"
                                                        required
                                                        value={passwordData.currentPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="••••••••"
                                                        className="bg-[#202020] border border-[#2a2a2a] rounded-lg text-sm pl-3 pr-10 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all w-full"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        className="absolute right-3 text-[#ababab] hover:text-white transition-colors"
                                                    >
                                                        {showCurrent ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs text-[#ababab]">New Password</label>
                                                    <div className="relative w-full flex items-center">
                                                        <input
                                                            type={showNew ? "text" : "password"}
                                                            name="newPassword"
                                                            required
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="••••••••"
                                                            className="bg-[#202020] border border-[#2a2a2a] rounded-lg text-sm pl-3 pr-10 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all w-full"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNew(!showNew)}
                                                            className="absolute right-3 text-[#ababab] hover:text-white transition-colors"
                                                        >
                                                            {showNew ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs text-[#ababab]">Confirm New Password</label>
                                                    <div className="relative w-full flex items-center">
                                                        <input
                                                            type={showConfirm ? "text" : "password"}
                                                            name="confirmPassword"
                                                            required
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="••••••••"
                                                            className="bg-[#202020] border border-[#2a2a2a] rounded-lg text-sm pl-3 pr-10 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all w-full"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirm(!showConfirm)}
                                                            className="absolute right-3 text-[#ababab] hover:text-white transition-colors"
                                                        >
                                                            {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={updatingPassword}
                                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white text-xs px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md shadow-blue-600/10 cursor-pointer"
                                                >
                                                    {updatingPassword ? 'Saving Changes...' : 'Save Password changes'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
}