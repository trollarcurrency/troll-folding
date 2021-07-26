import { work_db, users_db } from "./global.js";
import credit from './credit.js';
import cryptoRandomString from "crypto-random-string";
import xno from 'nanocurrency';
import * as crypto from 'crypto';
var users = [];
for (var i = 0; i < 50; i++) {
    var id = cryptoRandomString({ length: 10, type: 'alphanumeric' });
    users.push(id);
    var address = "troll" +
        xno.deriveAddress(cryptoRandomString({ length: 64, characters: '0123456789ABCDEF' })).slice(3);
    await users_db.run('INSERT INTO users(id, address, date) VALUES (?, ?, ?)', [id, address, Date.now()]);
    await work_db.run(`
        INSERT INTO work(id, user, credit, date, payment_hash, payment_date) 
        VALUES (?, ?, ?, ?, ?, ?)`, [
        cryptoRandomString({ length: 30, characters: 'alphanumeric' }),
        id,
        crypto.randomInt(0, 1000000),
        Date.now(),
        null,
        null
    ]);
}
await credit();
