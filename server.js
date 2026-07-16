const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static UI assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shorts', express.static(path.join(__dirname, 'shorts')));

// Mount sub-module routers
app.use('/api', require('./routes/browse'));
app.use('/api', require('./routes/generator'));
app.use('/api', require('./routes/subtitles'));
app.use('/api', require('./routes/studio'));

// Fallback wildcard route
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`[SYS] AIVERSE STUDIOS backend loaded  →  http://localhost:${PORT}`);
});
