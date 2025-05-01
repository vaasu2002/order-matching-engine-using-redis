import { Trade } from '../interface';
import { RedisClient } from '../services';
import { BaseTradeRepository } from './BaseTradeRepository';


export class RedisTradeRepository extends BaseTradeRepository {
    private redisClient: RedisClient;
    private keys = {
        trades: (symbol: string) => `trades:${symbol}`,
    };

    constructor(redisClient: RedisClient) {
        super();
        this.redisClient = redisClient;
    }


    async saveTrade(trade: Trade): Promise<void> {
        const client = this.redisClient.getClient();
        await client.lPush(this.keys.trades(trade.symbol), JSON.stringify(trade));
    }

    async getRecentTrades(symbol: string, limit = 50): Promise<Trade[]> {
        const client = this.redisClient.getClient();
        const tradeStrings: string[] = await client.lRange(this.keys.trades(symbol), 0, limit - 1);
        return tradeStrings.map(tradeString => JSON.parse(tradeString));
    }
}