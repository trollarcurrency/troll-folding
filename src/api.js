import express from 'express';
import xno from 'nanocurrency';
import cryptoRandomString from 'crypto-random-string';
import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';

const app = express();
app.use(express.json());
const port = 6547;

var db;
async function init() {
    db = await sqlite.open({
        filename: './data/users.db',
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users(
            id TEXT NOT NULL PRIMARY KEY,
            address TEXT NOT NULL UNIQUE,
            date INTEGER
        );
    `);
}
init();

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});

app.post('/', async (req, res) => {
    const address = (req.body.address || "").toString().trim();
    if (!address.startsWith("troll") ||
        !xno.checkAddress("nano" + address.slice(5))) {
        res.json({ error: "Invalid address" });
        return;
    }

    const existing_row = await db.get('SELECT id FROM users WHERE address = ?', address);
    if (existing_row) {
        res.json({ "id": existing_row.id });
        return;
    }

    const id = cryptoRandomString({ length: 10, type: 'alphanumeric' });

    await db.run('INSERT INTO users(id, address, date) VALUES (?, ?, ?)', [id, address, Date.now()]);

    res.json({
        "id": id
    });
});

process.on('SIGINT', function () {
    console.log("Shutting down");
    server.close();
    db.close();
    process.exit();
});
