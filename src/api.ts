import express from 'express';
import xno from 'nanocurrency';
import cryptoRandomString from 'crypto-random-string';
import { users_db } from './lib/global.js';

const router = express.Router();

router.post('/', async (req, res) => {
    

    const address = (req.body.address || "").toString().trim();
    if (!address.startsWith("troll") ||
        !xno.checkAddress("nano" + address.slice(5))) {
        res.json({ error: "Invalid address" });
        return;
    }

    const existing_row = await users_db.get('SELECT id FROM users WHERE address = ?', address);
    if (existing_row) {
        res.json({ "id": existing_row.id });
        return;
    }

    const id = cryptoRandomString({ length: 10, type: 'alphanumeric' });

    await users_db.run('INSERT INTO users(id, address, date) VALUES (?, ?, ?)', [id, address, Date.now()]);

    res.json({
        "id": id
    });
});

export default router;