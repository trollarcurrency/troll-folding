import express from 'express';
import xno from 'nanocurrency';
import cryptoRandomString from 'crypto-random-string';
import { users_db, hcaptcha_secret } from './global.js';
import { verify } from 'hcaptcha';

const router = express.Router();

router.post('/', async (req, res) => {
	const client_response = req.body['h-captcha-response'];
	if (!client_response) {
		res.json({
			"error": "no+captcha"
		});
		return;
	}
	
	var verify_success = null;
	try {
		verify_success = await verify(hcaptcha_secret, client_response);
	} catch {}

	if (!verify_success) {
		res.json({
			"error": "no+verify"
		});
		return;
	}

	const address = (req.body.address || "").toString().trim();
	if (!address.startsWith("troll") ||
		!xno.checkAddress("nano" + address.slice(5))) {
		res.json()
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