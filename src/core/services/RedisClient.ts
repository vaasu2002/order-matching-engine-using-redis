import { createClient } from 'redis';
import { config } from 'dotenv';
config();
export class RedisClient {
    private client: any; 
    private static instance: RedisClient;
    private constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
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
}