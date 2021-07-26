import { work_db, users_db, rpc } from "./util/global.js";

export default async function credit() {
	const select_query = 'SELECT id, user, credit FROM work WHERE payment_hash IS NULL';
	const work_array: Array<{
		id: string,
		user: string,
		credit: number
	}> = await work_db.all(select_query);

	const minimum_distribution = 1000;
	const balance = await rpc.balance();
	const to_distribute = balance - minimum_distribution;
	if (to_distribute < 0) {
		throw new Error("Not enough balance to distribute");
	}

	const internal_points = work_array.reduce((sum, val) => {
		return sum + points_formula(val.credit);
	}, 0);
	const scalar = to_distribute / internal_points;

	for (var i = 0; i < work_array.length; i++) {
		const work = work_array[i];
		const user_id = work.user;
		const payment_amount = points_formula(work.credit) * scalar;
		const address = (await users_db.get(
			`SELECT address FROM users WHERE id = "${user_id}"`
		)).address;
		const hash = await rpc.send(payment_amount, address);
		if (!hash) break;
		await work_db.run(
			'UPDATE work SET payment_hash = ?, payment_date = ? WHERE id = ?',
			[hash, Date.now(), work.id]
		);
	}

	return true;
}

function points_formula(credit: number) {
	return 1 / (1 + Math.sqrt(5000000 / credit));
}

credit();