interface PriceData {
  prices: number;
  decimal: number;
}
interface openTrade {
    asset: string,
    type: "long" | "short",
    margin: number,
    leverage: number,
    slippage: number,
    orderId: string
}
interface UserBalance {
    USD: number,
    freeMargin: number
}
export const prices: Record<string, PriceData> = {
  BTC: {
    prices: 0,
    decimal: 4,
  },
  SOL: {
    prices: 0,
    decimal: 4,
  },
  ETH: {
    prices: 0,
    decimal: 4,
  },
};

export const openTrades: Record<string, openTrade[]> = {};

export const Userbalances: Record<string, UserBalance> = {}