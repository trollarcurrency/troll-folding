import { work_db, users_db, rpc } from "./global.js";
export default async function credit() {
    const select_query = 'SELECT id, user, credit FROM work WHERE payment_hash IS NULL';
    const work_array = await work_db.all(select_query);
    const balance = await rpc.balance();
    var to_distribute = balance - 0.5; // error margin for floating point operations
    if (to_distribute <= 0) {
        throw new Error("Not enough balance to distribute");
    }
    // Maximum value
    if (to_distribute > 1000)
        to_distribute = 1000;
    const internal_points = work_array.reduce((sum, val) => {
        return sum + points_formula(val.credit);
    }, 0);
    const scalar = to_distribute / internal_points;
    for (var i = 0; i < work_array.length; i++) {
        const work = work_array[i];
        const user_id = work.user;
        const payment_amount = points_formula(work.credit) * scalar;
        const address = (await users_db.get(`SELECT address FROM users WHERE id = "${user_id}"`)).address;
        const hash = await rpc.send(payment_amount, address);
        if (!hash)
            break;
        await work_db.run('UPDATE work SET payment_hash = ?, payment_date = ? WHERE id = ?', [hash, Date.now(), work.id]);
    }
    return true;
}
function points_formula(credit) {
    return 1 / (1 + Math.sqrt(5000000 / credit));
}
