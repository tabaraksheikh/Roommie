require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const { assertDatabaseReady } = require('./config/db');
const errorHandler     = require('./middlewares/errorHandler');

const authRoutes    = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const userRoutes    = require('./routes/users');
const savedRoutes   = require('./routes/saved');

const app  = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, '..', 'frontend');
const uploadsDir = path.join(__dirname, 'uploads');
const pagesDir = path.join(frontendDir, 'pages');
const referenceDataDir = path.join(__dirname, 'database', 'reference-data');
const homePagePath = path.join(pagesDir, 'index.html');
const pageNames = ['index', 'browse', 'post', 'profile', 'space', 'poster', 'edit'];

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin:         '*',
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static assets ──────────────────────────────────────────────────────────────
app.use('/styles',  express.static(path.join(frontendDir, 'styles')));
app.use('/scripts', express.static(path.join(frontendDir, 'scripts')));
app.use('/reference-data', express.static(referenceDataDir));
app.use('/pages',   express.static(pagesDir));
app.use('/html',    express.static(pagesDir));
app.use('/images',  express.static(path.join(frontendDir, 'images')));
app.use('/uploads', express.static(uploadsDir));

// ── Page redirects ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.redirect('/pages/index.html'));

// Support top-level page URLs like /browse.html by redirecting them to /pages/.
app.get('/:page.html', (req, res, next) => {
  const { page } = req.params;
  if (!pageNames.includes(page)) return next();
  res.redirect(`/pages/${page}.html`);
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/saved',    savedRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Roommie API is running', timestamp: new Date().toISOString() });
});

// ── 404 fallback ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).sendFile(homePagePath);
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Boot ───────────────────────────────────────────────────────────────────────
assertDatabaseReady()
  .then(() => {
    app.listen(PORT, () => {
      console.log('\nRoommie server is running!');
      console.log(`   -> http://localhost:${PORT}`);
      console.log(`   -> API: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch(err => {
    console.error('Database is not ready:', err.message);
    process.exit(1);
  });
