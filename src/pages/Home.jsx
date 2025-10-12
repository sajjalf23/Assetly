import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi'
import features from '../data/features';
import { useState } from 'react'

export default function Home()
{
    const [email, setEmail] = useState("");

    const handleSubscribe = async (e) =>
    {
        e.preventDefault();
        console.log(email);
        // store the email in backend. First send a welcome email 00e238 39c14d
    }
    
    return (
        <div className="bg-[#0c0c0c]">
            <header className="flex items-center justify-between p-4">
                <img src = "/brandlogo.jpg" className="w-50"></img>
                <nav className="flex gap-4">
                    <button className="px-4 py-2 mr-2 rounded-md text-white cursor-pointer">Login</button>
                    <button className="px-4 py-2 mr-4 rounded-md bg-[#181818] text-white font-medium cursor-pointer">Get Started</button>
                </nav>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-20 mt-20">
                <section className="grid md:grid-cols-2 gap-12 items-center mt-12 text-white">
                    <div>
                        <h1 className="text-5xl md:text-6xl leading-tight font-extrabold mb-6">All your markets. All in one dashboard.</h1>
                        <p className="text-lg text-white/70 mb-6">Your portfolio simplified. Track stocks, crypto and forex&mdash;live, visual, and effortless. No spreadsheets. No tab-hopping. Just clear insights to make smarter decisions.</p>

                        <ul className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-white/70">
                            <li>• Real-time price streaming</li>
                            <li>• Portfolio PnL & allocation</li>
                            <li>• Sync accounts & import trades</li>
                        </ul>
                    </div>
                    
                    {/* { right-side main widget} */}
                    <div>
                        <div className="rounded-2xl p-7 bg-[#181818]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/70">Net Worth</p>
                                    <h2 className="text-3xl font-bold">$128,342</h2>
                                </div>
                                <div className="text-sm text-white/70">Updated: 2m ago</div>
                            </div>
                            <div className="grid grid-cols-3 gap-5 mt-5">
                                <div className="p-3 rounded-lg bg-white/5">
                                    <p className="text-sm text-white/60">Stocks</p>
                                    <h3 className="text-lg font-semibold">$72,120</h3>
                                    <p className="text-sm text-[#00e238]">+4.3%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5">
                                    <p className="text-sm text-white/60">Crypto</p>
                                    <h3 className="text-lg font-semibold">$38,004</h3>
                                    <p className="text-sm text-[#ff0000]">-2.1%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5">
                                    <p className="text-sm text-white/60">Forex</p>
                                    <h3 className="text-lg font-semibold">$18,218</h3>
                                    <p className="text-sm text-[#00e238]">+0.9%</p>
                                </div>
                            </div>

                            <div>
                                <hr className="mt-6 text-white/5"></hr>
                                <div className="mt-3 pt-4 text-sm text-white/60">Quick actions: <span className="ml-2">Add account • Import CSV • Connect Exchange</span></div>
                            </div>
                        </div>

                        {/* {right-side 3 widgets of crypto, stocks, forex} */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-white/5">
                                <div className="text-sm text-white/60">BTC/USD</div>
                                <div className="text-lg font-semibold">$27,120</div>
                                <div className="text-sm text-[#00e238]">+1.9%</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5">
                                <div className="text-sm text-white/60">AAPL</div>
                                <div className="text-lg font-semibold">$174.22</div>
                                <div className="text-sm text-[#00e238]">+0.6%</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5">
                                <div className="text-sm text-white/60">EUR/USD</div>
                                <div className="text-lg font-semibold">$1.0823</div>
                                <div className="text-sm text-[#ff0000]">-0.2%</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* {Features} */}
                <section className="mt-20 mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
                    {features.map((feature) => (
                        <div className='relative p-6 bg-white/5 rounded-2xl transition-transform transform duration-300 hover:scale-110 hover:shadow-lg cursor-pointer'>
                            
                            {/* {Icon} */}
                            <div className='absolute top-6 left-6 rounded-lg p-3 bg-white/60 text-black'>{feature.icon}</div>
                            
                            {/* {Heading and description of features} */}
                            <div className='text-xl font-semibold mt-16'>{feature.title}</div>
                            <div className='text-sm mt-4 text-white/60'>{feature.description}</div>
                        </div>
                    ))}
                </section>

                {/* {Footer} */}

                <footer className="border-t border-white/5 mt-20 py-8 text-white/60">
                {/* {left-side} */}
                <div className='grid md:grid-cols-2 gap-6 justify-between items-center'>
                    <div>
                        <div>© {new Date().getFullYear()} Assetly • Stocks • Crypto • Forex</div>
                        <div>Made by Misharab & Sajjal</div>
                    </div>

                    {/* {right-side} */}
                    <div className='flex flex-col md:items-end'>
                        <div className='flex flex-col md:items-start'>
                            <div className='font-semibold text-white'>Follow Us</div>
                            <div className='flex gap-4 text-xl mt-4'>
                                <div className='p-2.5 border rounded-md border-[#ababab] bg-white/5 hover:bg-[#ababab] transition duration-500 cursor-pointer'><FiFacebook /></div>
                                <div className='p-2.5 border rounded-md border-[#ababab] bg-white/5 hover:bg-[#ababab] transition duration-500 cursor-pointer'><FiTwitter /></div>
                                <div className='p-2.5 border rounded-md border-[#ababab] bg-white/5 hover:bg-[#ababab] transition duration-500 cursor-pointer'><FiInstagram /></div>
                                <div className='p-2.5 border rounded-md border-[#ababab] bg-white/5 hover:bg-[#ababab] transition duration-500 cursor-pointer'><FiLinkedin /></div>
                            </div>
                        </div>
                    </div>
                </div> 

                {/* {News Letter} */}
                   <section>
                    <div className='border-t border-white/5 mt-12 text-center flex flex-col items-center'>
                        <div className='text-white font-semibold text-xl mb-3 mt-10'>Stay Updated</div>
                        <div className='text-white/60 mb-4 max-w-md'>Get notified about new features, updates and financial news.</div>

                        <form onSubmit={handleSubscribe} className='flex gap-3 max-w-md w-full'>
                            <input 
                            type='email' 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='Enter your email' 
                            className='bg-white/5 p-4 border rounded-lg flex-grow placeholder-white/50 focus:outline-none focus:border-white transition duration-500'></input>
                            <button 
                            type='submit'
                            className='bg-[#ababab] text-black font-semibold p-4 pl-6 pr-6 border rounded-lg cursor-pointer'>Subscribe</button>
                        </form>
                    </div>
                   </section>
                </footer>

            </main>
        </div>
    )
}