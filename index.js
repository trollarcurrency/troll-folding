const start = new Date().getTime();

const fetch = require('undici-fetch');
const fs = require('fs').promises;
const util = require('util');
const csv_stringify = util.promisify(require('csv-stringify'));
const sqlite3 = require('sqlite3');
const open = require('sqlite').open;

const fah_url = "https://apps.foldingathome.org/teamstats/team234980.html";

async function get_api_data() {
	const response = await fetch(fah_url);
	var body = await response.text();
	console.log("Fetched",time());
	
	body = body.split('<table class="members">')[1];
	body = body.split('</body>')[0];
	
	var nodes = body.split(/<td>|<\/td>/);
	var result = {};
	for (var i = 5; i < nodes.length; i+= 10) {
		result[
			nodes[i]
		] = parseInt(nodes[i+2]);
	}
	console.log("Processed",time());
	
	return result;
}

async function main() {
	const current_data = await get_api_data();
	var previous_data;
	try {
		previous_data = JSON.parse(await fs.readFile("./data/previous_scraped.json"));
		if (Object.keys(current_data).length < Object.keys(previous_data).length) throw new Error();
	} catch {
		console.error("Prev data inacc./corr.");
		process.exit();
	}
	
	const work_json = [];
	for (var key in current_data) {
		if (previous_data[key] == current_data[key]) continue;
		const credit = current_data[key] - (previous_data[key] || 0);
		work_json.push({
			"id": key,
			"credit": credit,
			"date": start
		});
	}
	
	const work_csv = await csv_stringify(work_json);
	await fs.writeFile('./temp_work.csv', work_csv);
	console.log("Written",time());
}

function time() {
	const now = new Date().getTime();
	const time = now - start;
	return "(" + time + "ms)";
}

main();