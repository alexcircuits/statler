require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const path = require('path');
const { fetchUserStats } = require('./src/github');
const { generateCard } = require('./src/svg-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache: 10 minute TTL to reduce GitHub API calls
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Rate limiting: 30 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get user stats as JSON
app.get('/api/stats/:username', async (req, res) => {
    const { username } = req.params;

    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
        return res.status(400).json({ error: 'Invalid username' });
    }

    const cacheKey = `stats:${username.toLowerCase()}`;

    try {
        // Check cache first
        let stats = cache.get(cacheKey);

        if (!stats) {
            stats = await fetchUserStats(username);
            cache.set(cacheKey, stats);
        }

        res.json(stats);
    } catch (err) {
        console.error(`Error fetching stats for ${username}:`, err.message);
        res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
    }
});

// API: Generate SVG card
app.get('/api/card/:username', async (req, res) => {
    const { username } = req.params;
    const { stats: showStats, languages: showLanguages, streak: showStreak, activity: showActivity, include_private: includePrivate, show_name: showName, accent } = req.query;

    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
        return res.status(400).send('Invalid username');
    }

    // Validate accent color (hex without #)
    let accentColor = '58a6ff';
    if (accent && /^[0-9a-fA-F]{6}$/.test(accent)) {
        accentColor = accent;
    }

    const cacheKey = `stats:${username.toLowerCase()}`;

    try {
        let stats = cache.get(cacheKey);

        if (!stats) {
            stats = await fetchUserStats(username);
            cache.set(cacheKey, stats);
        }

        const options = {
            showStats: showStats !== 'false',
            showLanguages: showLanguages !== 'false',
            showStreak: showStreak !== 'false',
            showActivity: showActivity !== 'false',
            includePrivate: includePrivate === 'true',
            showName: showName !== 'false',
            accentColor
        };

        const svg = generateCard(stats, options);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=600'); // Browser cache: 10 min
        res.send(svg);
    } catch (err) {
        console.error(`Error generating card for ${username}:`, err.message);
        res.status(500).send(generateErrorCard(err.message));
    }
});

// Generate error card SVG
function generateErrorCard(message) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="100" viewBox="0 0 495 100">
    <rect x="0.5" y="0.5" width="494" height="99" rx="6" fill="#0d1117" stroke="#f85149"/>
    <text x="247" y="55" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#f85149">${message}</text>
  </svg>`;
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cached: cache.keys().length });
});

app.listen(PORT, () => {
    console.log(`🚀 GitHub Stats Generator running at http://localhost:${PORT}`);
    console.log(`📊 API: /api/card/:username`);
    console.log(`🔒 Rate limit: 30 req/min per IP`);
    console.log(`💾 Cache TTL: 10 minutes`);
});
