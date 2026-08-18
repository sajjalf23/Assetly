import { NavLink, useLocation } from 'react-router-dom';
import { LuHouse, LuNewspaper, LuChartNoAxesCombined, LuBitcoin, LuSettings } from "react-icons/lu";
import { MdOutlineAccountBalance, MdReceiptLong } from "react-icons/md";
import { FiTrendingUp } from "react-icons/fi";
import { FaExchangeAlt } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { useState, useContext } from 'react';
import { RxHamburgerMenu } from "react-icons/rx";
import { LuLogOut } from "react-icons/lu";
import { AppContext } from '../context/AppContext';


export default function Navbar() {
    const [openSidebar, setOpenSidebar] = useState(false);
    const { userData, logoutUser } = useContext(AppContext);
    console.log(userData);
    const location = useLocation();

    const handleLogout = async () => {
        await logoutUser();
        setOpenSidebar(false);
    };

    console.log("Current path:", location.pathname);

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
                h-screen fixed p-5 z-50 transition-transform duration-300
                ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0`
            }>

                <div className="flex items-center justify-between mb-6 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center bg-[#3a3a3a] rounded-full w-9 h-9 text-sm font-semibold">
                            {userData?.username?.[0]?.toUpperCase() || "G"}
                        </div>
                        <span className="truncate max-w-[120px]">{userData?.username || "Guest"}</span>
                    </div>

                    {/* 3. Clickable Logout Button aligned to the far right */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Logout"
                    >
                        <LuLogOut size={18} />
                    </button>
                </div>

                <hr className='text-[#3a3a3a]'></hr>

                {/* Use absolute paths with leading slash */}
                <NavLink to="/home"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] mt-6 ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <LuHouse />Home
                </NavLink>

                <NavLink to="/news"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <LuNewspaper />News
                </NavLink>

                <NavLink to="/overview"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <LuChartNoAxesCombined />Overview
                </NavLink>

                <NavLink to="/crypto"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <LuBitcoin />Crypto
                </NavLink>

                <NavLink to="/stocks"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <FiTrendingUp />Stocks
                </NavLink>

                <NavLink to="/forex"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <FaExchangeAlt />Forex
                </NavLink>

                <NavLink to="/accounts"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <MdOutlineAccountBalance />Accounts
                </NavLink>

                <NavLink to="/transactions"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <MdReceiptLong />Transactions
                </NavLink>

                <NavLink to="/earnings"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <HiShoppingBag />Earnings
                </NavLink>

                <hr className='mt-8 text-[#3a3a3a]'></hr>

                <NavLink to="/settings"
                    className={({ isActive }) => `flex items-center gap-2 p-1.5 text-sm rounded-lg hover:bg-[#1f1f1f] mt-6 ${isActive ? "bg-[#1f1f1f]" : ""}`}
                    onClick={() => setOpenSidebar(false)}>
                    <LuSettings />Settings
                </NavLink>
            </div>
        </>
    )
}