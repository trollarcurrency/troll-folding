import * as schedule from 'node-schedule';
import { logger, users_db, work_db } from './global.js';
import express from 'express';
import api_route from './api.js';
import retrieve from './retriever.js';
import credit from './credit.js';
import multer from 'multer';

const app = express();
app.use(multer().none());
app.use('/', express.static('public'));
app.use('/api', api_route);
const port = 8291;

const server = app.listen(port, () => {
	logger.info(`Listening at http://localhost:${port}`);
});

const rule = new schedule.RecurrenceRule();
rule.hour = 16;
rule.tz = 'Etc/UTC';
const job = schedule.scheduleJob(rule, initiatePayments);

async function initiatePayments() {
	logger.info("Fetching updated F@H data");
	try {
		await retrieve();
	} catch (e) {
		logger.error("Failed to retrieve updated F@H data", e);
		return;
	}
	logger.info("Attempting to credit");
	try {
		await credit();
	} catch (e) {
		logger.error("Failed to credit", e);
	}
}

process.on('SIGINT', function() {
	console.log('Shutting down');
	job.cancel();
	logger.close();
	server.close();
	work_db.close();
	users_db.close();
	process.exit();
});