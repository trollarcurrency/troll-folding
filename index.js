const start = new Date().getTime();
const fetch = require('undici-fetch');
const fs = require('fs');
const fah_url = "https://apps.foldingathome.org/teamstats/team234980.html";

async function main() {
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
		] = nodes[i+2];
	}
	console.log("Processed",time());
	
	fs.writeFile('result.txt', JSON.stringify(result), function(err) {
		if (err) console.log(err);
		console.log("Finished",time());
	});
}

function time() {
	const now = new Date().getTime();
	const time = now - start;
	return "(" + time + "ms)";
}

main();