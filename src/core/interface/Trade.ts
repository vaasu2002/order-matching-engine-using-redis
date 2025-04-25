export interface Trade {
    id: string;
    buyOrderId: string;
    sellOrderId: string;
    price: number;
    quantity: number;
    symbol: string;
    timestamp: number;
}