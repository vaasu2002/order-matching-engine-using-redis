import { createClient } from 'redis';
import { config } from 'dotenv';
config();
class RedisClient {
    private client: any; 
    private static instance: RedisClient;
    public constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
        this.client = createClient({ url: redisUrl });
    }

    /**
     * Get the singleton instance of RedisClient
     * @param redisUrl Optional Redis URL
    */
    public static getInstance(redisUrl?: string): RedisClient{
        if(!RedisClient.instance){
            RedisClient.instance = new RedisClient(redisUrl);
        }
        return RedisClient.instance;
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        await this.client.disconnect();
    }

    getClient(): any {
        return this.client;
    }

    /**
     * Initialize a counter if it doesn't exist
     * @param key Counter key
     * @param initialValue Initial value
     */
    async initCounter(key: string, initialValue: number = 0): Promise<void> {
        const exists = await this.client.exists(key);
        if(!exists){
            await this.client.set(key, initialValue.toString());
        }
    }

    async incrementCounter(key: string): Promise<number> {
        return await this.client.incr(key);
    }
}

export {RedisClient};