import { RedisClient } from './RedisClient';

class LockManager{
    private redisClient: RedisClient;

    constructor(redisClient: RedisClient){
        this.redisClient = redisClient;
    }

    /**
     * Acquire a lock on a resource
     * @param resource Resource name to lock
     * @param timeoutMs Lock timeout in milliseconds
     * @returns Whether the lock was acquired
     * @example
     * [ A tries to set "lock:order:619" with NX ] → Redis sets it → A proceeds
     * [ B tries to set "lock:order:619" with NX ] → Redis says NO → B skips or retries
     */
    async acquireLock(resource: string, timeoutMs = 5000): Promise<boolean> {
        const client = this.redisClient.getClient();
        const expireAt = Date.now() + timeoutMs;
        const value = `${Date.now()}`;

        // Try to acquire the lock with a retry mechanism
        while(Date.now() < expireAt){
            const result = await client.set(resource, value, {
                NX: true, // Only set the key if it does not already exist (redis will not overwrite the key
                // thus avoiding multiple processes from acquiring the same lock
                PX: timeoutMs
            });

            if(result==='OK'){
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    return false;
    }

    async releaseLock(resource: string): Promise<void> {
        const client = this.redisClient.getClient();
        await client.del(resource);
    }
}


export { LockManager };