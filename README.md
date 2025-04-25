# OrderBridge: TradeOrder Matching System

The Order Matching System is a key component of a trading platform that facilitates the placement and matching of buy and sell orders. The system uses Redis to store orders and match them in real, thus ensuring quick execution of trades.

The core functionality of the system is the ability to match buy and sell orders placed by users. Similar to how Polymarket operates for prediction market outcomes and how NSE/BSE match stock orders, this system matches orders based on price and availability, ensuring liquidity and efficient trade execution.

## Order Matching Engine

This service handles the core functionality of order matching, similar to how trading works on platforms like Polymarket or exchanges like NSE/BSE.

### Key Steps in Order Matching

#### 1. Order Placement

Users can place **buy** or **sell** orders for a given asset. Each order includes details such as the `orderId`, `symbol`, `price`, `quantity`, and `status`. These orders are stored efficiently in Redis as hashes, allowing for fast read/write access and quick matching.

#### 2. Matching Logic

The system constantly scans the order books to find matching pairs. A buy order is matched against sell orders at the same or lower price. Similarly, a sell order is matched against buy orders at the same or higher price.

To ensure consistency during this real-time matching process—especially in high-concurrency environments—the system uses Redis-based locking mechanisms. This guarantees that the same order isn't matched or modified in parallel by multiple processes.

> Example:
> - Buy Order: 10 units at ₹100
> - Sell Order: 10 units at ₹100  
The matching engine identifies the match and locks the involved orders to prevent race conditions. Once the trade is confirmed, the orders are marked as executed and removed or updated in the order book.


#### 3. Trade Execution
When a match is confirmed, the trade is executed at the agreed-upon price. Both orders are updated accordingly—partially filled if there's leftover quantity, or marked as fully matched and closed.

The system supports:
- **Limit Orders**: Executed only at the desired price.
- **Market Orders**: Executed at the best available price immediately.

This design allows the system to handle real-time matching reliably, even under high load, just like in traditional financial markets.
