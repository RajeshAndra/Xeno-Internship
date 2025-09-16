const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./utils/logger');
const {
	validationError,
	databaseError,
	jwtError,
	notFound,
	globalErrorHandler
} = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const shopifyRoutes = require('./routes/shopify');
const syncRoutes = require('./routes/sync');
const tenantRoutes = require('./routes/tenant');

function createApp() {
	const app = express();

	app.use(helmet({
		crossOriginResourcePolicy: { policy: 'cross-origin' }
	}));

	// CORS configuration
	const allowedOrigins = [
		'http://localhost:3000', 
		'http://localhost:3001',
		'https://shopify-insights-frontend-production.up.railway.app'
	];

	// Add FRONTEND_URL if it's set
	if (process.env.FRONTEND_URL) {
		allowedOrigins.push(process.env.FRONTEND_URL);
	}

	app.use(cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			
			if (allowedOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				console.log('CORS blocked origin:', origin);
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		optionsSuccessStatus: 200
	}));

	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ extended: true }));

	app.use(morgan('tiny', {
		stream: {
			write: (message) => logger.info(message.trim())
		}
	}));

	app.get('/', (req, res) => {
		res.json({ ok: true });
	});

	app.get('/health', (req, res) => {
		res.json({ status: 'ok' });
	});

	app.get('/api/health', (req, res) => {
		res.json({ 
			status: 'ok',
			origin: req.headers.origin,
			allowedOrigins: allowedOrigins
		});
	});

	app.use('/api/auth', authRoutes);
	app.use('/api/dashboard', dashboardRoutes);
	app.use('/api/shopify', shopifyRoutes);
	app.use('/api/sync', syncRoutes);
	app.use('/api/tenant', tenantRoutes);

	app.use(validationError);
	app.use(databaseError);
	app.use(jwtError);
	app.use(notFound);
	app.use(globalErrorHandler);

	return app;
}

module.exports = { createApp }; 