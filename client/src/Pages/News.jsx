import React, { useState, useEffect, useMemo } from 'react';
import { LuSearch, LuExternalLink, LuTrendingUp } from "react-icons/lu";
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const categories = ["all", "crypto", "forex", "stocks"];

const formatDate = (ts) => {
  if (!ts) return '';
  const dateMs = ts > 1e11 ? ts : ts * 1000;
  return new Date(dateMs).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatTimeAgo = (ts) => {
  if (!ts) return '';
  const now = Date.now();
  const dateMs = ts > 1e11 ? ts : ts * 1000;
  const diff = now - dateMs;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

export default function News() {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${url}/api/news/all`);
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Filtered news using safe null-checks
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const headline = (item.headline || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesQuery = headline.includes(query) || summary.includes(query);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [news, searchQuery, selectedCategory]);

  // Derive trending articles from category-filtered results
  const featuredNews = useMemo(() => filteredNews.slice(0, 3), [filteredNews]);

  const getCategoryColor = (cat) => {
    const colors = {
      crypto: '#4ade80',
      stocks: '#3b82f6',
      forex: '#fbbf34'
    };
    return colors[cat] || '#888';
  };

  return (
    <SkeletonTheme baseColor="#181818" highlightColor="#2a2a2a">
      <div className="flex flex-col w-full bg-[#0d0d0d] pt-10 px-4 md:px-8 gap-6 pb-10">

        {/* Featured News Banner */}
        {loading ? (
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-4">
              <LuTrendingUp className="text-[#2a2a2a]" size={20} />
              <Skeleton width={130} height={20} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((_, idx) => (
                <div key={idx} className="bg-[#0d0d0d] rounded-xl p-4">
                  <Skeleton width={60} height={12} className="mb-2" />
                  <Skeleton count={2} height={14} className="mb-2" />
                  <Skeleton width={80} height={12} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          !searchQuery && featuredNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-[#181818] to-[#1f1f1f] rounded-2xl p-6 border border-[#2a2a2a]"
            >
              <div className="flex items-center gap-2 mb-4">
                <LuTrendingUp className="text-green-400" size={20} />
                <h2 className="text-white font-semibold text-lg">Trending Now</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {featuredNews.map((item, idx) => (
                  <motion.a
                    key={item.id || item.url || idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#0d0d0d] rounded-xl p-4 hover:bg-[#141414] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.category) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#ababab] mb-1 uppercase">
                          {item.category}
                        </div>
                        <div className="text-white font-medium text-sm line-clamp-2 group-hover:text-green-400 transition-colors">
                          {item.headline}
                        </div>
                        <div className="text-xs text-[#888] mt-2">
                          {formatTimeAgo(item.datetime)}
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )
        )}

        {/* Search & Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex items-center bg-[#181818] rounded-xl px-4 py-3 w-full md:w-1/3 border border-[#2a2a2a] focus-within:border-green-400 transition-colors">
            <LuSearch className="text-[#ababab] mr-3" size={18} />
            <input
              type="text"
              placeholder="Search headlines, summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-[#888] outline-none w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium text-sm cursor-pointer ${selectedCategory === cat
                  ? "bg-green-400 text-black"
                  : "bg-[#181818] text-white hover:bg-[#2a2a2a]"
                  } transition`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        {searchQuery && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#ababab] text-sm"
          >
            Found {filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''} for "{searchQuery}"
          </motion.div>
        )}

        {/* News Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div
                key={idx}
                className="bg-[#181818] rounded-2xl flex flex-col overflow-hidden border border-[#2a2a2a] p-4 h-80 justify-between"
              >
                <div>
                  <Skeleton height={128} borderRadius={12} className="mb-4" />
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton width={60} height={12} />
                    <Skeleton width={40} height={12} />
                  </div>
                  <Skeleton height={18} className="mb-2" />
                  <Skeleton count={2} height={12} />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#2a2a2a]">
                  <Skeleton width={70} height={12} />
                  <Skeleton width={80} height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20 bg-[#181818] rounded-2xl border border-[#2a2a2a]">
            <div className="text-white text-base font-semibold mb-1">No News Articles Found</div>
            <div className="text-[#ababab] text-sm">Try adjusting your search terms or filters.</div>
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item, idx) => (
                <motion.a
                  key={item.id || item.url || idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#181818] rounded-2xl flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border border-[#2a2a2a] hover:border-green-400/50 group"
                >
                  {/* News Image */}
                  {item.image && (
                    <div className="relative overflow-hidden h-32">
                      <img
                        src={item.image}
                        alt={item.headline || 'News'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.parentElement) {
                            e.target.parentElement.style.display = 'none';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent opacity-60"></div>
                    </div>
                  )}

                  <div className="flex flex-col justify-between p-4 h-full">
                    <div>
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(item.category) }}
                        />
                        <div className="text-xs text-[#ababab] uppercase font-medium tracking-wide">
                          {item.category}
                        </div>
                        <div className="text-xs text-[#666] ml-auto">
                          {formatTimeAgo(item.datetime)}
                        </div>
                      </div>

                      {/* Headline */}
                      <div className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-snug">
                        {item.headline}
                      </div>

                      {/* Summary */}
                      <div className="text-[#cccccc] text-sm line-clamp-2 leading-relaxed">
                        {item.summary}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2a2a2a]">
                      <div className="text-xs text-[#888]">
                        {formatDate(item.datetime)}
                      </div>
                      <div className="flex items-center gap-1 text-green-400 text-xs font-medium group-hover:gap-2 transition-all">
                        Read More
                        <LuExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </SkeletonTheme>
  );
}