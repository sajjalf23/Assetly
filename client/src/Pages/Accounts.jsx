import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import { MdDelete, MdEdit } from 'react-icons/md';
import { AppContext } from '../context/appContext';
import axios from 'axios';

export default function Accounts() {
    const { userData, BackendUrl, toast } = useContext(AppContext);
    const [showAddForm, setShowAddForm] = useState(false);
    const [accounts, setAccounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedExchange, setSelectedExchange] = useState('');
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [editingExchange, setEditingExchange] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const exchangeTypes = [
        { id: 'stock', label: 'Stock', fields: ['stock_api', 'stock_account_id'], color: '#3b82f6' },
        { id: 'forex', label: 'Forex', fields: ['forex_api', 'forex_account_id'], color: '#fbbf34' },
        { id: 'wallet', label: 'Wallet', fields: ['eth_address', 'etherscan_api_key'], color: '#8b5cf6' },
        { id: 'binance', label: 'Binance', fields: ['binance_api_key', 'binance_api_secret'], color: '#f59e0b' },
        { id: 'kucoin', label: 'KuCoin', fields: ['kucoin_api_key', 'kucoin_api_secret', 'kucoin_passphrase'], color: '#10b981' },
        { id: 'coinbase', label: 'Coinbase', fields: ['coinbase_api_key', 'coinbase_api_secret', 'coinbase_passphrase'], color: '#0052ff' }
    ];

    const fieldLabels = {
        stock_api: 'API Key',
        stock_account_id: 'Account ID',
        forex_api: 'API Key',
        forex_account_id: 'Account ID',
        eth_address: 'ETH Address',
        etherscan_api_key: 'Etherscan API Key',
        binance_api_key: 'API Key',
        binance_api_secret: 'API Secret',
        kucoin_api_key: 'API Key',
        kucoin_api_secret: 'API Secret',
        kucoin_passphrase: 'Passphrase',
        coinbase_api_key: 'API Key',
        coinbase_api_secret: 'API Secret',
        coinbase_passphrase: 'Passphrase'
    };

    const getAuthToken = () => {
        return localStorage.getItem("access_token");
    };

    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        try {
            const token = getAuthToken();
            
            if (!token) {
                setError('Please log in to continue');
                toast.error('Please log in to continue');
                window.location.href = '/login';
                return null;
            }

            const config = {
                method,
                url: `${BackendUrl}/api${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: body
            };

            const response = await axios(config);
            return response.data;
        } catch (err) {
            console.error('API Request Error:', err);
            
            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem("access_token");
                window.location.href = '/login';
                return null;
            }
            
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Request failed';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        }
    };

    async function loadAccounts() {
        setLoading(true);
        setError('');
        try {
            const response = await apiRequest('/account/accounts');
            if (response && response.success) {
                setAccounts(response.account || {});
            }
        } catch (err) {
            console.error('Failed to load accounts:', err);
            setAccounts({});
        } finally {
            setLoading(false);
        }
    }

    async function saveAccount(accountData) {
        try {
            const response = await apiRequest('/account/accounts', 'POST', accountData);
            return response;
        } catch (err) {
            console.error('Failed to save account:', err);
            throw err;
        }
    }

    async function updateAccount(accountId, accountData) {
        try {
            const response = await apiRequest(`/account/accounts/${accountId}`, 'PUT', accountData);
            return response;
        } catch (err) {
            console.error('Failed to update account:', err);
            throw err;
        }
    }

    async function deleteExchangeData(exchangeId) {
        try {
            const response = await apiRequest('/account/exchange-data', 'DELETE', {
                exchangeType: exchangeId
            });
            return response;
        } catch (err) {
            console.error('Failed to delete exchange data:', err);
            throw err;
        }
    }

    useEffect(() => {
        if (userData) {
            loadAccounts();
        }
    }, [userData]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (showDropdown && !event.target.closest('.dropdown-container')) {
                setShowDropdown(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    function handleSelectExchange(exchangeId) {
        setSelectedExchange(exchangeId);
        setShowAddForm(true);
        setShowDropdown(false);
        setFormData({});
        setError('');
        setEditingExchange(null);
        
        const exchange = exchangeTypes.find(e => e.id === exchangeId);
        if (exchange && accounts) {
            const existingData = {};
            exchange.fields.forEach(field => {
                if (accounts[field]) {
                    existingData[field] = accounts[field];
                }
            });
            setFormData(existingData);
        }
    }

    function handleCancel() {
        setShowAddForm(false);
        setSelectedExchange('');
        setFormData({});
        setError('');
        setEditingExchange(null);
    }

    function handleEdit(exchange) {
        setEditingExchange(exchange.id);
        setSelectedExchange(exchange.id);
        setShowAddForm(true);
        
        const existingData = {};
        exchange.fields.forEach(field => {
            if (exchange.data[field]) {
                existingData[field] = exchange.data[field];
            }
        });
        setFormData(existingData);
    }

    function handleInputChange(field, value) {
        setFormData(prev => ({ 
            ...prev, 
            [field]: value 
        }));
    }

    async function handleSubmit() {
        if (!selectedExchange) {
            setError('Please select an exchange type');
            toast.error('Please select an exchange type');
            return;
        }

        const exchange = exchangeTypes.find(e => e.id === selectedExchange);
        const dataToSave = {};
        
        exchange.fields.forEach(field => {
            dataToSave[field] = formData[field] || '';
        });

        try {
            let result;
            if (accounts?.id) {
                result = await updateAccount(accounts.id, dataToSave);
            } else {
                result = await saveAccount(dataToSave);
            }
            
            if (result?.success) {
                await loadAccounts();
                handleCancel();
                setError('');
                toast.success(result.message || 'Account saved successfully');
            }
        } catch (err) {
            // Error handled in apiRequest
        }
    }

    async function handleDeleteExchange(exchangeId) {
        const exchange = exchangeTypes.find(e => e.id === exchangeId);
        const confirmed = window.confirm(`Are you sure you want to delete your ${exchange.label} credentials?`);
        if (!confirmed) return;

        try {
            const result = await deleteExchangeData(exchangeId);
            if (result?.success) {
                await loadAccounts();
                setError('');
                toast.success(result.message || `${exchange.label} data deleted successfully`);
            }
        } catch (err) {
            // Error handled
        }
    }

    function getConnectedExchanges() {
        if (!accounts || Object.keys(accounts).length === 0) return [];
        
        const connected = [];
        exchangeTypes.forEach(exchange => {
            const hasData = exchange.fields.some(field => 
                accounts[field] && accounts[field].trim() !== ''
            );
            
            if (hasData) {
                connected.push({
                    ...exchange,
                    data: exchange.fields.reduce((acc, field) => {
                        acc[field] = accounts[field] || '';
                        return acc;
                    }, {}),
                    createdAt: accounts.created_at,
                    updatedAt: accounts.updated_at
                });
            }
        });
        return connected;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getFieldValues(exchange) {
        return exchange.fields
            .filter(field => exchange.data[field] && exchange.data[field].trim() !== '')
            .map(field => {
                const value = exchange.data[field];
                if (field.includes('secret') || field.includes('passphrase')) {
                    return '••••••••';
                }
                return value.length > 15 ? `${value.substring(0, 15)}...` : value;
            })
            .join(', ');
    }

    const connectedExchanges = getConnectedExchanges();

    if (!userData) {
        return (
            <div className="flex bg-[#0d0d0d] pt-20 overflow-x-hidden w-full max-w-[100vw] min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2dd4bf] mb-4"></div>
                    <p className="text-white">Please log in to view your accounts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#0d0d0d] pt-20 overflow-x-hidden w-full max-w-[100vw] min-h-screen">
            <div className="flex flex-col w-full m-4 gap-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 100, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: false }}
                    className="flex justify-between items-start"
                >
                    <div>
                        <h1 className="text-2xl text-white font-semibold">Connected Accounts</h1>
                        <p className="text-sm text-[#ababab] mt-1">Manage your exchange connections and account details</p>
                    </div>
                    
                    {/* Dropdown Button */}
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                            <FaPlus size={12} />
                            Add Exchange
                            <FaChevronDown size={12} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-[#181818] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                                {exchangeTypes.map(exchange => (
                                    <button
                                        key={exchange.id}
                                        onClick={() => handleSelectExchange(exchange.id)}
                                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#202020] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-3"
                                    >
                                        <div 
                                            className="rounded-full h-2.5 w-2.5" 
                                            style={{ background: exchange.color }}
                                        ></div>
                                        {exchange.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Add/Edit Form */}
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#181818] p-6 rounded-2xl border border-[#2a2a2a]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg text-white font-semibold">
                                {editingExchange ? 'Update' : 'Add'} {exchangeTypes.find(e => e.id === selectedExchange)?.label} Account
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="text-[#ababab] hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {exchangeTypes
                                .find(e => e.id === selectedExchange)
                                ?.fields.map(field => (
                                    <div key={field} className="space-y-2">
                                        <label className="block text-xs text-[#ababab]">
                                            {fieldLabels[field]}
                                        </label>
                                        <input
                                            type={field.includes('secret') || field.includes('passphrase') ? 'password' : 'text'}
                                            value={formData[field] || ''}
                                            onChange={(e) => handleInputChange(field, e.target.value)}
                                            className="w-full bg-[#202020] text-white text-sm px-4 py-2.5 rounded-lg border border-[#2a2a2a] focus:border-[#3b82f6] focus:outline-none transition-all"
                                            placeholder={`Enter ${fieldLabels[field]}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                    {editingExchange ? 'Update' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="bg-[#202020] hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Connected Accounts Table - Only show if there are connected exchanges */}
                {connectedExchanges.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 100, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="rounded-2xl overflow-hidden bg-[#181818] mt-6"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-xs font-medium text-[#ababab] bg-[#1f1f1f]">
                                    <tr>
                                        <th className="py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none">Exchange</th>
                                        <th className="py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none">Status</th>
                                        <th className="py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none">Values</th>
                                        <th className="py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none">Created At</th>
                                        <th className="py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none">Updated At</th>
                                        <th className="py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {connectedExchanges.map((exchange, index) => (
                                        <tr 
                                            key={index} 
                                            className="text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]"
                                        >
                                            <td className="py-3 px-4 select-none">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="rounded-full h-3 w-3" 
                                                        style={{ background: exchange.color }}
                                                    ></div>
                                                    <span>{exchange.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 select-none">
                                                <span className="px-2 py-0.5 rounded-md text-xs bg-green-500/20 text-green-400">
                                                    Connected
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 select-none">
                                                <span className="text-xs text-[#ababab] font-mono">
                                                    {getFieldValues(exchange)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 select-none text-xs text-[#ababab]">
                                                {formatDate(exchange.createdAt)}
                                            </td>
                                            <td className="py-3 px-4 select-none text-xs text-[#ababab]">
                                                {formatDate(exchange.updatedAt)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(exchange)}
                                                        className="text-[#ababab] hover:text-[#3b82f6] transition-colors p-1.5"
                                                        title="Edit"
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExchange(exchange.id)}
                                                        className="text-[#ababab] hover:text-red-400 transition-colors p-1.5"
                                                        title="Delete"
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}