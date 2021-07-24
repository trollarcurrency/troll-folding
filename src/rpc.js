import axios from 'axios';
import { logger } from './global.js';
import bigRat from 'big-rational';
import cryptoRandomString from 'crypto-random-string';

export default class RPC {
    constructor(wallet, server) {
        this.wallet = wallet;
        this.server = server;
    }
    async init() {
        const response = await axios.post(this.server, {
            "action": "account_list",
            "wallet": this.wallet
        });
        this.address = response["accounts"][0];
        if (!this.address) {
            logger.error("Failed to initialize RPC");
            logger.error("Response", response);
            process.exit();
        }
        logger.info("Initialized RPC");
    }
    async send(amount, destination) {
        const req_json = {
            "action": "send",
            "wallet": this.wallet,
            "source": this.address,
            "destination": destination,
            "amount": toRaw(amount),
            "id": cryptoRandomString({ length: 30, type: 'alphanumeric' })
        };
        var block;
        for (var i = 0; i < 3; i++) {
            const response = await axios.post(server, req_json);
            block = response["block"];
            if (!block) {
                logger.error("Failed to send");
                logger.error("Request", req_json);
                logger.error("Response", response);
            } else {
                break;
            }
        }
        return block || null;
    }
    async balance() {
        const response = await axios.post(server, {
            "action": "wallet_balances",
            "wallet": this.wallet
        });
        var balance = null;
        for (var key in response["balances"]) {
            balance = response["balances"][key]["balance"];
        }
        if (!balance) {
            logger.error("Failed to retrieve balance");
            logger.error("Response", response);
            process.exit();
        }
        return balance;
    }
}

function toRaw(amount) {
    return bigRat(amount).multiply(10n ** 29n).round(true).toString();
}

function toDec(amount) {
    return bigRat(amount).divide(10n ** 29n).toDecimal();
}