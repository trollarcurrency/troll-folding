const start = Date.now();

import fetch from 'undici-fetch';
import os from 'os';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { exec as exec_callback } from 'child_process';
const exec = promisify(exec_callback);
import { default as csv_callback } from 'csv-stringify';
const csv_stringify = promisify(csv_callback);
import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';
import binarySearchContains from './binary-search.js';

const fah_url = "https://apps.foldingathome.org/teamstats/team234980.html";

async function get_api_data() {
	const response = await fetch(fah_url);
	var body = await response.text();
	console.log("Fetched", time());

	body = body.split('<table class="members">')[1];
	body = body.split("</body>")[0];

	var nodes = body.split(/<td>|<\/td>/);
	var result = {};
	for (var i = 5; i < nodes.length; i += 10) {
		result[nodes[i]] = parseInt(nodes[i + 2]);
	}
	console.log("Processed", time());

	return result;
}

async function main() {
	const current_data = await get_api_data();
	var previous_data;
	try {
		previous_data = JSON.parse(
			await fs.readFile("./data/previous_scraped.json")
		);
		if (Object.keys(current_data).length < Object.keys(previous_data).length)
			throw new Error();
	} catch {
		console.error("Prev data inacc./corr.");
		process.exit();
	}

	const users_db = await sqlite.open({
		filename: "./data/users.db",
		driver: sqlite3.Database,
	});
	const select_query = 'SELECT id FROM users';
	const users_array = (await users_db.all(select_query)).map(x => x.id).sort();
	await users_db.close();

	const work_json = [];
	for (var key in current_data) {
		if (previous_data[key] == current_data[key]) continue;
		if (!binarySearchContains(users_array, key)) continue;
		const credit = current_data[key] - (previous_data[key] || 0);
		work_json.push({
			id: key,
			credit: credit,
			date: start,
			hash: "",
		});
	}

	const work_csv = await csv_stringify(work_json);
	await fs.writeFile("./data/temp_work.csv", work_csv);
	console.log("Written", time());

	const work_db = await sqlite.open({
		filename: "./data/work.db",
		driver: sqlite3.Database,
	});

	const create_query = `
		CREATE TABLE IF NOT EXISTS work(
			id TEXT NOT NULL,
			credit INTEGER NOT NULL,
			date INTEGER NOT NULL,
			hash TEXT
		);`;

	await work_db.exec(create_query);
	await work_db.close();
	console.log("Initialized", time());

	const sql_cli = os.platform() === "win32" ? "sqlite3.exe" : "./sqlite3";
	await exec(
		sql_cli +
			' ./data/work.db -cmd ".mode csv" ".import ./data/temp_work.csv work"'
	);
	console.log("Imported", time());

	await fs.writeFile(
		"./data/previous_scraped.json",
		JSON.stringify(current_data)
	);
	await fs.unlink("./data/temp_work.csv");
	console.log("Finished", time());

	console.log("New work: " + work_json.length);
}

function time() {
	const now = Date.now();
	const time = now - start;
	return "(" + time + "ms)";
}

main();