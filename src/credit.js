import { work_db, users_db, rpc, logger } from "./global.js";

export default async function credit(to_distribute) {
    const select_query = 'SELECT id, credit FROM work WHERE payment_hash IS NULL';
    const work_array = await work_db.all(select_query);

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
        rpc.send(payment_amount, address);
    }
}

function points_formula(credit) {
    return 1 / (1 + Math.sqrt(5000000 / credit));
}

credit();