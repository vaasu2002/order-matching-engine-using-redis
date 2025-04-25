export interface Order {
    id: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    remainingQuantity: number;
    symbol: string;
    userId: string;
    timestamp: number;
    expirationTimestamp: number | null;
}