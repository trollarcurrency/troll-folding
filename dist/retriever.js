import fetch from 'undici-fetch';
import os from 'os';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { exec as exec_callback } from 'child_process';
const exec = promisify(exec_callback);
import { default as csv_callback } from 'csv-stringify';
const csv_stringify = promisify(csv_callback);
import binarySearchContains from './util/binary-search.js';
import cryptoRandomString from 'crypto-random-string';
import { users_db, logger, work_db } from './global.js';
var start;
const fah_url = "https://apps.foldingathome.org/teamstats/team1061660.html";
async function get_api_data() {
    const response = await fetch(fah_url);
    var body = await response.text();
    logger.info("Fetched", time());
    body = body.split('<table class="members">')[1];
    body = body.split("</body>")[0];
    var nodes = body.split(/<td>|<\/td>/);
    var result = {};
    for (var i = 5; i < nodes.length; i += 10) {
        result[nodes[i]] = parseInt(nodes[i + 2]);
    }
    logger.info("Processed", time());
    return result;
}
export default async function retrieve() {
    start = Date.now();
    const current_data = await get_api_data();
    var previous_data;
    try {
        previous_data = JSON.parse(await fs.readFile("./data/previous_scraped.json", 'utf8'));
        if (Object.keys(current_data).length < Object.keys(previous_data).length)
            throw new Error();
    }
    catch {
        throw new Error("Prev data inacc./corr.");
    }
    const select_query = 'SELECT id FROM users';
    const users_array = (await users_db.all(select_query)).map(x => x.id).sort();
    const work_json = [];
    for (var key in current_data) {
        if (previous_data[key] == current_data[key])
            continue;
        if (!binarySearchContains(users_array, key))
            continue;
        const credit = current_data[key] - (previous_data[key] || 0);
        work_json.push({
            id: cryptoRandomString({ length: 30, type: 'alphanumeric' }),
            user: key,
            credit: credit,
            date: start,
            payment_hash: "",
            payment_date: ""
        });
    }
    const work_csv = await csv_stringify(work_json);
    await fs.writeFile("./data/temp_work.csv", work_csv);
    logger.info("Written", time());
    logger.info("Initialized", time());
    const sql_cli = os.platform() === "win32" ? "sqlite3.exe" : "./sqlite3";
    await exec(sql_cli +
        ' ./data/work.db -cmd ".mode csv" ".import ./data/temp_work.csv work"');
    logger.info("Imported", time());
    const fix_null_query = (col) => `
		UPDATE work
		SET ${col} = NULL
		WHERE ${col} = "";
	`;
    await work_db.exec(fix_null_query('payment_hash'));
    await work_db.exec(fix_null_query('payment_date'));
    logger.info("Fixed", time());
    await fs.writeFile("./data/previous_scraped.json", JSON.stringify(current_data));
    await fs.unlink("./data/temp_work.csv");
    logger.info("Finished", time());
    var new_work = work_json.length;
    logger.info("New work:", new_work);
    return true;
}
function time() {
    const now = Date.now();
    const time = now - start;
    return `(${time}ms)`;
}
