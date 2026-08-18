import React, { useState } from 'react';
import { LuDownload, LuX } from 'react-icons/lu';
import { toast } from 'react-toastify';

const ExportTransactionsModal = ({
    onClose,
    selectedAccount = ''
}) => {

    const [format, setFormat] = useState('xlsx');
    const [exporting, setExporting] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const handleExport = async () => {
        try {
            setExporting(true);

            let url = `${backendUrl}/api/transactions/export?format=${format}`;

            console.log("Backend URL:", backendUrl);
            console.log("Export URL:", url);

            if (selectedAccount) {
                url += `&account=${encodeURIComponent(selectedAccount)}`;
            }

            const token = localStorage.getItem("access_token");

            if (!token) {
                toast.error("You are not logged in");
                return;
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export transactions');
            }

            const blob = await response.blob(); // blob tells browser that the response is a file

            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = downloadUrl;

            link.download =
                format === 'xlsx'
                    ? 'assetly-transactions.xlsx'
                    : format === 'csv'
                        ? 'assetly-transactions.csv'
                        : 'assetly-transactions.json';

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Transactions exported successfully!');

            onClose();

        } catch (error) {
            console.error('Export error:', error);

            toast.error('Failed to export transactions');

        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

            <div className="w-full max-w-md bg-[#181818] rounded-xl border border-[#2a2a2a] shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a2a]">

                    <div>
                        <h2 className="text-white text-lg font-semibold">
                            Export Transactions
                        </h2>

                        <p className="text-[#ababab] text-sm mt-1">
                            Download your transaction history
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-[#ababab] hover:text-white transition-colors cursor-pointer"
                    >
                        <LuX size={20} />
                    </button>

                </div>

                {/* Body */}
                <div className="px-6 py-6">

                    <label className="block text-sm text-[#ababab] mb-2">
                        Format
                    </label>

                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full bg-[#111] text-white border border-[#333] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#2285c3] cursor-pointer focus:outline-none"
                    >
                        <option value="xlsx" className="cursor-pointer">
                            Excel (.xlsx)
                        </option>

                        <option value="csv" className="cursor-pointer">
                            CSV (.csv)
                        </option>

                        <option value="json" className="cursor-pointer">
                            JSON (.json)
                        </option>
                    </select>

                    {selectedAccount && (
                        <p className="text-xs text-[#777] mt-3">
                            Exporting transactions for: {selectedAccount}
                        </p>
                    )}

                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">

                    <button
                        onClick={onClose}
                        disabled={exporting}
                        className="px-4 py-2 rounded-md bg-[#222] text-white hover:bg-[#2a2a2a] transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#2285c3] text-white hover:bg-[#1a6b9c] disabled:opacity-50 transition-colors"
                    >
                        <LuDownload size={16} />

                        {exporting ? 'Exporting...' : 'Export'}
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ExportTransactionsModal;