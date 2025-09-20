import { Userbalances, openTrades, prices } from "./inMemory/data";
import { redis } from "./redis";

export const openOrderCheck = async (
  margin: number,
  userId: string,
  id: string,
  _asset: string,
  _type: string
): Promise<boolean> => {
  const userBalance = Userbalances[userId];
  if (!userBalance) {
    console.log("we cannot find the balance for this userId");
    await redis.xdel("price-stream", id);
    return false;
  }

  const { USD, freeMargin } = userBalance;
  if (freeMargin >= margin) {
    Userbalances[userId] = {
      USD,
      freeMargin: freeMargin - margin,
      assets: userBalance.assets
    };
    return true;
  }

  await redis.xdel("price-stream", id);
  return false;
};
export const closeOrderCheck = async (
  orderId: string,
  userId: string,
  id: string
): Promise<{ ok: boolean; pnl?: number; message?: string }> => {
  const trades = openTrades[userId];
  if (!trades || trades.length === 0) {
    await redis.xdel("price-stream", id);
    return { ok: false, message: "No open trades for user" };
  }

  const tradeIndex = trades.findIndex((t: any) => t.orderId === orderId);
  if (tradeIndex === -1) {
    await redis.xdel("price-stream", id);
    return { ok: false, message: "Order not found" };
  }

  const trade = trades[tradeIndex] as any;
  const currentPrice = prices[trade.asset]?.prices ?? 0;
  const entryPrice = trade.executedPrice ?? 0;
  const leverage = Math.max(1, Number(trade.leverage) || 1);
  const notional = (trade.margin ?? 0) * leverage;
  const priceChangePct = entryPrice > 0 ? (currentPrice - entryPrice) / entryPrice : 0;

  let pnl = notional * priceChangePct;
  if (trade.type === "short") {
    pnl = -pnl;
  }

  if (pnl < 0) {
    pnl = 0;
  }

  const userBalance = Userbalances[userId];
  if (userBalance) {
    Userbalances[userId] = {
      USD: userBalance.USD + pnl,
      freeMargin: userBalance.freeMargin + (trade.margin ?? 0),
      assets: userBalance.assets
    };
  }

  await redis.xdel("price-stream", id);
  return { ok: true, pnl };
};