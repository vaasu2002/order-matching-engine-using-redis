import { Order,Trade } from '.';

export interface MatchResult {
    order: Order;
    trades: Trade[];
    fullyMatched: boolean;
}