const express = require('express');
const xno = require('nanocurrency');
const cryptoRandomString = require('crypto-random-string');
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;

const app = express();
const port = 6547;
var db;

async function init() {
    db = await open({
        filename: './data/users.db',
        driver: sqlite3.Database
    });
    const create_query = `
        CREATE TABLE IF NOT EXISTS users(
            id TEXT NOT NULL PRIMARY KEY,
            address TEXT NOT NULL
        );`;
	await db.exec(create_query);
}

init();

app.use(express.json());

app.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`);
});

app.post("/", async (req, res) => {
	var address = (req.body.address || "").toString().trim();
	if (
		!address.startsWith("troll") ||
		!xno.checkAddress("nano" + address.slice(5))
	) {
		res.json({ error: "Invalid address" });
		return;
	}
	const id = cryptoRandomString({length: 10, type: 'alphanumeric'});

	await db.run('INSERT INTO USERS(id, address) VALUES (?), (?)', [id, address]);

    res.json({
        "id": id
    });
});