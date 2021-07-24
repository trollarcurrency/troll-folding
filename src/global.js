import winston from 'winston';
import util from 'util';
import DailyRotateFile from 'winston-daily-rotate-file';
import Database from './db-wrap.js';
import RPC from './rpc.js';

export const logger = winston.createLogger({
    format: winston.format.combine(
        {transform: (info) => {
            info.message = util.format(info.message, ...info[Symbol.for('splat')] || [])
            return info;
          }
        },
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH-mm-ss'
        }),
        winston.format.printf(
            info => `${info.timestamp} ${info.level}: ${info.message}`
        )
    ),
    transports: [
        new DailyRotateFile({
            filename: './logs/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
        }),
        new winston.transports.Console()
    ]
});

export const runs_db = await Database({
    file: './data/runs.db',
    name: 'runs',
    schema: [
        'date INTEGER NOT NULL',
        'new_work INTEGER NOT NULL',
        'credited INTEGER NOT NULL'
    ]
});

export const users_db = await Database({
    file: './data/users.db',
    name: 'users',
    schema: [
        'id TEXT NOT NULL PRIMARY KEY',
        'address TEXT NOT NULL UNIQUE',
        'date INTEGER'
    ]
});

export const work_db = await Database({
    file: './data/work.db',
    name: 'work',
    schema: [
        'id TEXT PRIMARY KEY NOT NULL',
        'user TEXT NOT NULL',
		'credit INTEGER NOT NULL',
		'date INTEGER NOT NULL',
		'payment_hash TEXT',
        'payment_date INTEGER',
    ]
});

export const rpc = new RPC(process.env.TROLL_WALLET, 'http://localhost:42727');
//rpc.init();