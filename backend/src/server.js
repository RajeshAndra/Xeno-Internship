require('dotenv').config();
const { createApp } = require('./app');
const logger = require('./utils/logger');
const { testConnection, syncDatabase } = require('./models');

const app = createApp();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
	try {
		const dbConnected = await testConnection();
		if (!dbConnected) {
			logger.error('Database connection failed');
			process.exit(1);
		}

		const dbSynced = await syncDatabase();
		if (!dbSynced) {
			logger.error('Database sync failed');
			process.exit(1);
		}

		app.listen(PORT, () => {
			logger.info(`Server listening on ${PORT}`);
			logger.info(`Env: ${process.env.NODE_ENV || 'development'}`);
			logger.info(`Health: http://localhost:${PORT}/api/health`);
		});

	} catch (error) {
		logger.error('Startup error', error);
		process.exit(1);
	}
};

process.on('SIGTERM', () => {
	logger.info('SIGTERM received, exiting');
	process.exit(0);
});

process.on('SIGINT', () => {
	logger.info('SIGINT received, exiting');
	process.exit(0);
});

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception', error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection', { promise, reason });
	process.exit(1);
});

startServer();