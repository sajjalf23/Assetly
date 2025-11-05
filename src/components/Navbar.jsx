import { NavLink } from 'react-router-dom'
import { LuHouse, LuNewspaper, LuChartNoAxesCombined, LuBitcoin, LuSettings } from "react-icons/lu";
import { MdOutlineAccountBalance, MdReceiptLong } from "react-icons/md";
import { FiTrendingUp } from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { useState } from 'react';
import { RxHamburgerMenu } from "react-icons/rx";


export default function Navbar() {
    const [openSidebar, setOpenSidebar] = useState(false);

    return (
        <>
            <button className='md:hidden fixed top-4 left-4 text-white text-3xl z-50'
                onClick={() => setOpenSidebar(!openSidebar)}>
                <RxHamburgerMenu />
            </button>

            {openSidebar && (
                <div
                    className='fixed inset-0 bg-black/50 z-40 md:hidden'
                    onClick={() => setOpenSidebar(!openSidebar)}
                ></div>
            )}

            <div className={
                `flex flex-col gap-0.5 bg-[#181818] text-white w-[250px]
                h-[100vh] fixed p-5 z-50 transition-transform duration-300
                ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0`
            }>

                <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center justify-center bg-[#3a3a3a] rounded-[50%] p-1.5 w-9 h-9">O</div>
                    <div>Oliver Lim</div>
                </div>

                <hr className='text-[#3a3a3a]'></hr>

                {/* <NavLink to = "/Abc" className = "block p-1.5 text-sm rounded-lg hover:bg-gray-700 mt-6">Abc</NavLink> */}
                {/* <NavLink to = "earnings" className = "p-1.5 text-sm rounded-lg hover:bg-gray-700">Earnings</NavLink> */}

                <NavLink to="home" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] mt-6 ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><LuHouse />Home</NavLink>
                <NavLink to="news" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><LuNewspaper />News</NavLink>
                <NavLink to="overview" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><LuChartNoAxesCombined />Overview</NavLink>
                <NavLink to="crypto" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><LuBitcoin />Crypto</NavLink>
                <NavLink to="stocks" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><FiTrendingUp />Stocks</NavLink>
                <NavLink to="forex" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><FaExchangeAlt />Forex</NavLink>
                <NavLink to="accounts" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><MdOutlineAccountBalance />Accounts</NavLink>
                <NavLink to="transactions" className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><MdReceiptLong />Transactions</NavLink>
                <NavLink to="earnings" className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`} onClick={() => setOpenSidebar(!openSidebar)}><HiShoppingBag />Earnings</NavLink>

                <hr className='mt-8 text-[#3a3a3a]'></hr>

                <NavLink to="settings" className={({ isActive }) => `flex items-center gap-2 p-1.5  text-sm rounded-lg hover:bg-[#1f1f1f] mt-6 ${isActive ? "bg-[#1f1f1f]" : ""}`}><LuSettings />Settings</NavLink>
            </div>
        </>
    )
}