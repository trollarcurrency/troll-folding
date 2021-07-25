import axios from 'axios';
import { logger } from './lib/global.js';
import bigRat from 'big-rational';
import cryptoRandomString from 'crypto-random-string';

export default class RPC {
    wallet: string;
    server: string;
    address: string | null;
    constructor(wallet: string | undefined, server: string) {
        if (!wallet) {
            logger.error("Missing wallet ID in RPC initialization");
            process.exit();
        }
        this.wallet = wallet;
        this.server = server;
        this.address = null;
    }
    async init() {
        const response: {
            accounts: Array<string>
        } = await axios.post(this.server, {
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
    async send(amount: string | number, destination: string) {
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
            const response: {
                block: string | undefined
            } = await axios.post(this.server, req_json);
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
        const response: {
            balances: {
                [address: string]: {
                    balance: string,
                    pending: string
                }
            }
        } = await axios.post(this.server, {
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
        return toDec(balance);
    }
}

function toRaw(amount: string | number) {
    return bigRat(amount).multiply(10n ** 29n).round(true).toString();
}

function toDec(amount: string | number) {
    return bigRat(amount).divide(10n ** 29n).toDecimal();
}