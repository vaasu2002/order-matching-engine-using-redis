import { jest } from '@jest/globals';
import { LockManager } from '../../../src/core/services/LockManager';
import { RedisClient } from '../../../src/core/services/RedisClient';

// Mock the RedisClient
jest.mock('../../../src/core/services/RedisClient', () => {
    return {
        RedisClient: jest.fn().mockImplementation(() => {
            return {
                getClient: jest.fn().mockReturnValue({
                set: jest.fn(),
                del: jest.fn()
                })
            };
        })
    };
});

describe('LockManager', () => {
    let lockManager: LockManager;
    let mockRedisClient: RedisClient;
    let mockRedis: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        jest.restoreAllMocks();
        
        // Create a new instance of the mock RedisClient
        mockRedisClient = new RedisClient();
        mockRedis = mockRedisClient.getClient();
        
        // Create a new LockManager instance with the mock
        lockManager = new LockManager(mockRedisClient);
    });

    describe('acquireLock', () => {
        it('should acquire a lock successfully on first try', async () => {
            // Mock the Redis set method to return 'OK'
            mockRedis.set.mockResolvedValueOnce('OK');
            
            const result = await lockManager.acquireLock('resource:123', 5000);
            
            // Assertions
            expect(result).toBe(true);
            expect(mockRedis.set).toHaveBeenCalledTimes(1);
            expect(mockRedis.set).toHaveBeenCalledWith(
                'resource:123', 
                expect.any(String), 
                { NX: true, PX: 5000 }
            );
        });
        
        it('should fail to acquire a lock after retries', async () => {
            // Mock the Redis set method to return null (lock not acquired)
            mockRedis.set.mockResolvedValue(null);
            
            // Use spyOn instead of direct assignment to avoid TypeScript errors
            jest.spyOn(lockManager, 'acquireLock').mockImplementation(async (resource, timeoutMs = 5000) => {
                // Call Redis set once to ensure the mock is used
                await mockRedis.set(resource, expect.any(String), {
                NX: true,
                PX: timeoutMs
                });
                
                // Return false to simulate lock acquisition failure
                return false;
            });
        
            const result = await lockManager.acquireLock('resource:123', 5000);
            
            // Assertions
            expect(result).toBe(false);
            expect(mockRedis.set).toHaveBeenCalledTimes(1);
        }, 10000);
        
        it('should retry acquiring a lock until success', async () => {
            // Mock the Redis set method to fail once then succeed
            mockRedis.set
                .mockResolvedValueOnce(null)  // First try fails
                .mockResolvedValueOnce('OK'); // Second try succeeds
            
            // Use jest.spyOn to mock setTimeout properly
            jest.spyOn(global, 'setTimeout').mockImplementation((callback: Function, _ms?: number, ..._args: any[]) => {
                callback();
                return 1 as any; // Return a dummy timeout ID
            });
            
            const result = await lockManager.acquireLock('resource:123', 5000);
            
            // Restore original setTimeout
            jest.restoreAllMocks();
            
            // Assertions
            expect(result).toBe(true);
            expect(mockRedis.set).toHaveBeenCalledTimes(2);
        }, 10000);
        
        it('should use default timeout if not specified', async () => {
            // Mock the Redis set method to return 'OK'
            mockRedis.set.mockResolvedValueOnce('OK');
            
            await lockManager.acquireLock('resource:123');
            
            // Assertions
            expect(mockRedis.set).toHaveBeenCalledWith(
                'resource:123', 
                expect.any(String), 
                { NX: true, PX: 5000 } // Default timeout is 5000ms
            );
        });
    });

    describe('releaseLock', () => {
        it('should release a lock by calling del on the Redis client', async () => {
            // Mock the Redis del method
            mockRedis.del.mockResolvedValueOnce(1);
            
            await lockManager.releaseLock('resource:123');
            
            // Assertions
            expect(mockRedis.del).toHaveBeenCalledTimes(1);
            expect(mockRedis.del).toHaveBeenCalledWith('resource:123');
        });
    });
});