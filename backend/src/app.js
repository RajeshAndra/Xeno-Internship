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

	app.use(cors({
		origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
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
		res.json({ status: 'ok' });
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