import React from 'react'
import { useState } from 'react';
import { LuSearch } from "react-icons/lu";
import { transactions } from '../data/transactionsDummyData'

// Colors
const PLATFORM_COLORS = {
  "Binance": "#F3BA2F",
  "KuCoin": "#24AE8F",
  "Coinbase": "#0052FF",
  "OANDA": "#00214A",
  "PaperInvest": "#d6ff35"
};


const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDates, setSelectedDates] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState("")
  const [selectedTypes, setSelectedTypes] = useState("")


  // Backend data
  const [chartData, setChartData] = useState([]);
  const [total, setTotal] = useState(0);

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const filteredData = transactions.filter((row) => {
    const matchesSearch = 
      row.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.entity.toLowerCase().includes(searchQuery.toLowerCase()) 

    const matchesAccount = 
      !selectedAccounts || row.account === selectedAccounts

    const matchesType = 
    !selectedTypes ||
      (selectedTypes === "Incoming" && Number(row.amount) >= 0) ||
      (selectedTypes === "Outgoing" && Number(row.amount) < 0)

    return matchesSearch && matchesAccount && matchesType

});

  const displayData = searchQuery ? filteredData : chartData;

  return (
    <div className="mx-full max-w-6xl px-6">
      <h1 className='text-white font-semibold text-xl pt-12 pb-6'>Transactions</h1>
      <div className='flex items-center justify-between mb-7'>

        <div className='flex items-center gap-3 bg-[#181818] p-2 rounded-md w-full sm:w-1/3'>
          <LuSearch size={20} className='text-white' />
          <input
            type='text'
            placeholder='Search transactions'
            value={searchQuery}
            onChange={handleSearch}
            className='bg-transparent text-white w-full focus:outline-none'
          />
        </div>

        {/* Account Filter Dropdowns */}
        <div className='flex gap-4'>
          <select
          value={selectedDates}
          onChange={(e) => setSelectedDates(e.target.value)}
            
            className='bg-[#181818] text-sm text-[#ababab] p-2 rounded-md focus:outline-none border-none hover:bg-[#111] cursor-pointer'
          >
            <option value="">Date</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>

          <select
            value={selectedAccounts}
            onChange={(e) => setSelectedAccounts(e.target.value)}
            className='bg-[#181818] text-sm text-[#ababab] p-2 rounded-md focus:outline-none border-none hover:bg-[#111] cursor-pointer'
          >
            <option value="">Account</option>
            <option value="Binance">Binance</option>
            <option value="KuCoin">KuCoin</option>
            <option value="Coinbase">Coinbase</option>
            <option value="OANDA">OANDA</option>
            <option value="Paper Invest">Paper Invest</option>
          </select>

          <select
            value={selectedTypes}
            onChange={(e) => setSelectedTypes(e.target.value)}
            className='bg-[#181818] text-sm text-[#ababab] p-2 rounded-md focus:outline-none border-none hover:bg-[#111] cursor-pointer'
          >
            <option value="">Type</option>
            <option value="Incoming">Incoming</option>
            <option value="Outgoing">Outgoing</option>
          </select>
        </div>

      </div>

      <div className='rounded-2xl overflow-hidden bg-[#181818] mt-6 mb-12 overflow-x-auto'>
        <table className='w-full'>
          <thead className='text-sm text-[#ababab] bg-[#1f1f1f]'>
            <tr>
              <th className='pl-10 py-2.5 text-left'>Account</th>
              <th className='pl-25 py-2.5 text-center'>Date</th>
              <th className='py-2.5 text-right'>Entity</th>
              <th className='pr-5 py-2.5 text-right'>Units</th>
              <th className='pr-5 py-2.5 text-right'>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                <td className='px-4 py-2.25 select-none'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-full h-3 w-3' style={{ background: PLATFORM_COLORS[row.account] }}></div>
                    <span>{row.account}</span>
                  </div>
                </td>
                <td className='py-2.25 px-4 text-right select-none'>{row.date}</td>
                <td className='py-2.25 px-4 text-right select-none'>{row.entity}</td>
                <td className='py-2.25 px-4 pr-5 text-right select-none'>{row.quantity}</td>
                <td className='py-2.25 px-4 pr-5 text-right select-none'>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  )
}

export default Transactions
