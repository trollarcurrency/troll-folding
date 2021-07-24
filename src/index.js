import * as schedule from 'node-schedule';
import { logger } from './global.js';
import express from 'express';
import api_route from './api.js';
import retrieve from './retriever.js';

const app = express();
app.use(express.json());
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
    const new_work = await retrieve();
}