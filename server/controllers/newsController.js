import axios from 'axios'; 

const FINNHUB_BASE = 'https://finnhub.io/api/v1/news';
const apiKey = process.env.FINNHUB_API_KEY;

export const getNews = async (req, res) => {
  try {
    const categories = ['crypto', 'forex', 'stocks']; 
    // Fetch news for all categories
    const requests = categories.map(category =>
      axios.get(`${FINNHUB_BASE}?category=${category}&token=${apiKey}`)
    );
    const responses = await Promise.all(requests);
    // Merge all news sort 
    const allNews = responses.flatMap(r => r.data);
    allNews.sort((a, b) => b.datetime - a.datetime);
    res.json(allNews);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};
