import { useState, useMemo } from 'react';
import { LuSearch, LuArrowUpRight, LuArrowDownRight, LuArrowUpDown } from "react-icons/lu";

const mockTransactions = [
  { id: "1", account: "PayPal", transaction_date: "2026-03-30T10:00:00Z", entity: "Starbucks", quantity: 2, amount: -24.75 },
  { id: "2", account: "Revolut", transaction_date: "2026-03-30T11:00:00Z", entity: "Café Royal", quantity: 1, amount: -12.62 },
  { id: "3", account: "Revolut", transaction_date: "2026-03-30T12:00:00Z", entity: "Tram Network", quantity: 3, amount: -7.02 },
  { id: "4", account: "PayPal", transaction_date: "2026-03-30T13:00:00Z", entity: "Spotify", quantity: 1, amount: -76.84 },
  { id: "5", account: "HSBC", transaction_date: "2026-03-30T14:00:00Z", entity: "Migros", quantity: 5, amount: -198.62 },
  { id: "6", account: "HSBC", transaction_date: "2026-03-29T10:00:00Z", entity: "Café Royal", quantity: 2, amount: -25.15 },
  { id: "7", account: "HSBC", transaction_date: "2026-03-29T11:00:00Z", entity: "Swiss Power Co", quantity: 1, amount: -50.00 },
  { id: "8", account: "Revolut", transaction_date: "2026-03-28T09:00:00Z", entity: "Bus Stop", quantity: 4, amount: -26.95 },
  { id: "9", account: "PayPal", transaction_date: "2026-03-28T10:00:00Z", entity: "Café Royal", quantity: 1, amount: -26.70 },
  { id: "10", account: "PayPal", transaction_date: "2026-03-28T11:00:00Z", entity: "Cinema Max", quantity: 2, amount: -90.21 },
  { id: "11", account: "PayPal", transaction_date: "2026-03-28T12:00:00Z", entity: "Rewe", quantity: 3, amount: -165.81 },
  { id: "12", account: "Revolut", transaction_date: "2026-03-27T09:00:00Z", entity: "Amazon", quantity: 1, amount: -49.99 },
  { id: "13", account: "HSBC", transaction_date: "2026-03-27T10:00:00Z", entity: "Shell Petrol", quantity: 1, amount: -85.40 },
  { id: "14", account: "PayPal", transaction_date: "2026-03-26T08:00:00Z", entity: "Salary Deposit", quantity: 1, amount: 3200.00 },
  { id: "15", account: "Revolut", transaction_date: "2026-03-26T09:00:00Z", entity: "Netflix", quantity: 1, amount: -15.99 },
];

const accountColors = {
  PayPal: "#2285c3",
  Revolut: "#8c22c3",
  HSBC: "#c3225f",
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDir, setSortDir] = useState("desc");

  const accounts = ["All", ...Array.from(new Set(mockTransactions.map((t) => t.account)))];

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    return mockTransactions
      .filter((t) => {
        const matchSearch =
          t.entity.toLowerCase().includes(search.toLowerCase()) ||
          t.account.toLowerCase().includes(search.toLowerCase());
        const matchAccount = accountFilter === "All" || t.account === accountFilter;
        const matchType =
          typeFilter === "All" ||
          (typeFilter === "Income" && t.amount >= 0) ||
          (typeFilter === "Expense" && t.amount < 0);
        return matchSearch && matchAccount && matchType;
      })
      .sort((a, b) => {
        let va = a[sortField];
        let vb = b[sortField];
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [search, accountFilter, typeFilter, sortField, sortDir]);

  const totalExpenses = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter((t) => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
  const net = totalIncome + totalExpenses;

  const SortIcon = ({ field }) => (
    <LuArrowUpDown
      size={12}
      className={`inline ml-1 transition-opacity ${sortField === field ? "opacity-100 text-white" : "opacity-30"}`}
    />
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-white">

      {/* Demo Banner */}
      <div className="text-center text-xs text-yellow-400/80 bg-yellow-500/10 border-b border-yellow-500/15 py-2 px-4">
        Notice: this is a demo account, underlying market data may not reflect real-time conditions as it may be shifted in time.
      </div>

      <div className="p-6 pt-8 flex flex-col gap-6">

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#181818] rounded-2xl p-5 shadow-lg flex flex-col gap-1">
            <p className="text-sm text-[#ababab]">Total Transactions</p>
            <p className="text-2xl font-semibold text-white">{filtered.length}</p>
          </div>
          <div className="bg-[#181818] rounded-2xl p-5 shadow-lg flex flex-col gap-1">
            <p className="text-sm text-[#ababab] flex items-center gap-1">
              <LuArrowUpRight size={14} className="text-green-400" /> Income
            </p>
            <p className="text-2xl font-semibold text-green-400">+{totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          </div>
          <div className="bg-[#181818] rounded-2xl p-5 shadow-lg flex flex-col gap-1">
            <p className="text-sm text-[#ababab] flex items-center gap-1">
              <LuArrowDownRight size={14} className="text-red-400" /> Expenses
            </p>
            <p className="text-2xl font-semibold text-red-400">{totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-3 bg-[#181818] px-3 py-2 rounded-md flex-1 min-w-48 max-w-xs">
            <LuSearch size={16} className="text-[#ababab] shrink-0" />
            <input
              type="text"
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              spellCheck={false}
              className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500 text-sm"
            />
          </div>

          {/* Account filter */}
          <div className="flex items-center gap-1 bg-[#181818] rounded-md px-1 py-1">
            {accounts.map((acc) => (
              <button
                key={acc}
                onClick={() => setAccountFilter(acc)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  accountFilter === acc ? "bg-white/15 text-white" : "text-[#ababab] hover:text-white"
                }`}
              >
                {acc}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-[#181818] rounded-md px-1 py-1">
            {["All", "Income", "Expense"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  typeFilter === t ? "bg-white/15 text-white" : "text-[#ababab] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden bg-[#181818] overflow-x-auto">
          <table className="w-full">
            <thead className="text-sm font-medium text-[#ababab] bg-[#1f1f1f]">
              <tr>
                <th
                  className="pl-6 py-3 px-4 text-left font-mono uppercase tracking-wide select-none cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("account")}
                >
                  Account <SortIcon field="account" />
                </th>
                <th
                  className="py-3 px-4 text-left font-mono uppercase tracking-wide select-none cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("transaction_date")}
                >
                  Date <SortIcon field="transaction_date" />
                </th>
                <th
                  className="py-3 px-4 text-left font-mono uppercase tracking-wide select-none cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("entity")}
                >
                  Entity <SortIcon field="entity" />
                </th>
                <th
                  className="py-3 px-4 text-right font-mono uppercase tracking-wide select-none cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("quantity")}
                >
                  Quantity <SortIcon field="quantity" />
                </th>
                <th
                  className="pr-6 py-3 px-4 text-right font-mono uppercase tracking-wide select-none cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  Amount <SortIcon field="amount" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#ababab] text-sm">
                    No transactions found
                  </td>
                </tr>
              )}
              {filtered.map((t, index) => (
                <tr
                  key={t.id}
                  className="text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020] transition-colors"
                >
                  {/* Account */}
                  <td className="py-3 px-4 pl-6 select-none">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full h-3 w-3 shrink-0"
                        style={{ background: accountColors[t.account] || "#6B7280" }}
                      />
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: (accountColors[t.account] || "#6B7280") + "33", border: `1px solid ${(accountColors[t.account] || "#6B7280")}55` }}
                      >
                        {t.account}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-[#ababab] text-xs select-none whitespace-nowrap">
                    {formatDate(t.transaction_date)}
                  </td>

                  {/* Entity */}
                  <td className="py-3 px-4 font-medium select-none">{t.entity}</td>

                  {/* Quantity */}
                  <td className="py-3 px-4 text-right select-none">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-white/6 text-xs font-semibold text-[#ababab]">
                      {t.quantity}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className={`py-3 px-4 pr-6 text-right font-semibold select-none tabular-nums ${t.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#ababab] pb-8">
          <span>Showing {filtered.length} of {mockTransactions.length} transactions</span>
          <span>
            Net:{" "}
            <span className={net >= 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
              {net >= 0 ? "+" : ""}
              {net.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </span>
        </div>

      </div>
    </div>
  );
}