const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const subscriptionRoutes = require('./routes/subscription');

const app = express();

// Security headers
app.use(helmet());

// Logging
app.use(morgan(process.env.LOG_FORMAT || 'dev'));

// CORS - allow configured origins or all in absence (override in prod)
const allowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({ origin: (origin, cb) => {
	if (!origin) return cb(null, true);
	if (allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
	return cb(new Error('Not allowed by CORS'));
}, credentials: true }));

app.use(bodyParser.json());
app.use('/subscription', subscriptionRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Subscription engine running on ${PORT}`));
