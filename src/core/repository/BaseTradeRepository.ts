import { Trade } from '../interface';


export abstract class BaseTradeRepository {
    
    abstract saveTrade(trade: Trade): Promise<void>;
    
    abstract getRecentTrades(symbol: string, limit?: number): Promise<Trade[]>;
    
    generateTradeId(buyOrderId: string, sellOrderId: string): string {
        return `trade_${Date.now()}_${buyOrderId}_${sellOrderId}`;
    }
        
    createTrade(buyOrderId: string, sellOrderId: string, price: number,quantity: number, symbol: string): Trade {
        return {
            id: this.generateTradeId(buyOrderId, sellOrderId),
            buyOrderId,
            sellOrderId,
            price,
            quantity,
            symbol,
            timestamp: Date.now()
        };
    }
}