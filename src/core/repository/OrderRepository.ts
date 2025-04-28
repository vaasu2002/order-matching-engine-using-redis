import { RedisClient } from '../services';
import { Order } from '../interface';


export class OrderRepository {
  private redisClient: RedisClient;
  private keys = {
    nextOrderId: 'next_order_id',
    orderDetails: (id: string) => `order:${id}`,
    expiredOrders: 'expired:orders',
  };
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async initialize(): Promise<void> {
    await this.redisClient.initCounter(this.keys.nextOrderId);
  }

  /**
   * Generate a new order ID
   * @returns Promise<string>
   */
  async generateOrderId(): Promise<string> {
    const id = await this.redisClient.incrementCounter(this.keys.nextOrderId);
    return `order_${id}`;
  }

  /**
   * Convert order object to Redis hash
   * @param order Order object
   * @returns Record<string, string>
   */
  private orderToRedisHash(order: Order): Record<string, string> {
    return {
      id: order.id,
      type: order.type,
      price: order.price.toString(),
      quantity: order.quantity.toString(),
      remainingQuantity: order.remainingQuantity.toString(),
      symbol: order.symbol,
      userId: order.userId,
      timestamp: order.timestamp.toString(),
      expirationTimestamp: order.expirationTimestamp?.toString() || '',
    };
  }

  /**
   * Convert Redis hash to order object
   * @param hash Redis hash
   * @returns Order
   */
  private redisHashToOrder(hash: Record<string, string>): Order {
    return {
      id: hash.id,
      type: hash.type as 'BUY' | 'SELL',
      price: parseFloat(hash.price),
      quantity: parseFloat(hash.quantity),
      remainingQuantity: parseFloat(hash.remainingQuantity),
      symbol: hash.symbol,
      userId: hash.userId,
      timestamp: parseInt(hash.timestamp, 10),
      expirationTimestamp: hash.expirationTimestamp ? parseInt(hash.expirationTimestamp, 10) : null,
    };
  }

  /**
   * Save an order to Redis
   * @param order Order object
   */
  async saveOrder(order: Order): Promise<void> {
    const client = this.redisClient.getClient();
    await client.hSet(this.keys.orderDetails(order.id), this.orderToRedisHash(order));
  }

  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns The order or null if not found
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const client = this.redisClient.getClient();
    const orderHash = await client.hGetAll(this.keys.orderDetails(orderId));
    if (!orderHash || Object.keys(orderHash).length === 0) {
      return null;
    }
    return this.redisHashToOrder(orderHash);
  }

  /**
   * Update order remaining quantity
   * @param orderId Order ID
   * @param remainingQuantity New remaining quantity
   */
  async updateRemainingQuantity(orderId: string, remainingQuantity: number): Promise<void> {
    const client = this.redisClient.getClient();
    await client.hSet(
      this.keys.orderDetails(orderId),
      'remainingQuantity',
      remainingQuantity.toString()
    );
  }

  /**
   * Update order status
   * @param orderId Order ID
   * @param status New status
   */
  async updateStatus(orderId: string, status: string): Promise<void> {
    const client = this.redisClient.getClient();
    await client.hSet(this.keys.orderDetails(orderId), 'status', status);
  }

  /**
   * Mark an order as expired
   * @param orderId Order ID
   */
  async markAsExpired(orderId: string): Promise<void> {
    const client = this.redisClient.getClient();
    await client.sAdd(this.keys.expiredOrders, orderId);
    await this.updateStatus(orderId, 'expired');
  }
}