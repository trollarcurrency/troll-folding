import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';
import * as os from 'os';
export default async function Database({ file, name, schema }) {
    var db = await sqlite.open({
        filename: file,
        driver: sqlite3.Database
    });
    await db.exec(`
		CREATE TABLE IF NOT EXISTS ${name}(
			${schema.join("," + os.EOL)}
		);`);
    return db;
}
;
