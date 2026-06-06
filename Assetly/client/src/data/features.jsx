import { FaSyncAlt, FaBell } from 'react-icons/fa';
import { TbFileAnalytics } from "react-icons/tb";
import { IoBarChartSharp } from "react-icons/io5";
import { LuShieldCheck, LuFileClock, LuCircleHelp } from "react-icons/lu";
import { PiExportBold } from "react-icons/pi";
import { ImNewspaper } from "react-icons/im";

const features = [
    {
        id: 1,
        icon: <FaSyncAlt size={20}/>,
        title: 'Auto-Sync Trading',
        description: 'Connect exchanges, transactions auto-categorized for you. Track your assets effortlessly'
    },
    {
        id: 2,
        icon: <TbFileAnalytics size={22}/>,
        title: 'Unified Portfolio',
        description: 'See stocks, crypto, forex in a single net worth view. Real-time PnL, allocation analysis, and history'
    },
    {
        id: 3,
        icon: <FaBell size={20}/>,
        title: 'Smart Alerts',
        description: 'Custom-price and portfolio alerts-never miss a market move. Get notified via email instantly.'
    },
    {
        id: 4,
        icon: <IoBarChartSharp className='w-4.5 h-4.5'/>,
        title: 'Advanced Analytics',
        description: 'View detailed charts, performance graphs, and monthly earnings reports with visual insights.'
    },
    {
        id: 5,
        icon: <ImNewspaper size={22}/>, 
        title: 'Market News',
        description: 'Stay informed with the latest updates and insights from global markets--track events that influence crypto, stocks and forex trends.'
    },
    {
        id: 6,
        icon: <PiExportBold size={22}/>,
        title: 'Export Anywhere',
        description: 'Export trade records, reports, in CSV or PDF formats instantly.'
    },
    {
        id: 7,
        icon: <LuShieldCheck size={22}/>,
        title: 'Secure Connections',
        description: "API-based secure connections to exchanges. Your credentials are encrypted."
    },
    {
        id: 8,
        icon: <LuFileClock size={22}/>,
        title: 'Transaction History',
        description: 'Complete history of all trades deposits, and withdrawals across all platforms.'
    }, 
    {
        id: 9,
        icon: <LuCircleHelp size={22}/>,
        title: 'Help & Guides',
        description: 'Step-by-step guidance on connecting exchanges, generating API keys, and using all platform features effectively.'
    }
]

export default features;