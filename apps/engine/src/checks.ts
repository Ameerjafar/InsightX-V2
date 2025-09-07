import { Userbalances, openTrades, prices } from "./inMemory/data";
import { redis } from "./redis";

export const openOrderCheck = async (
  margin: number,
  userId: string,
  id: string,
  asset: string,
  type: string
) => {
  if (Userbalances[userId]) {
    const USD = Userbalances[userId].USD;
    const freeMargin = Userbalances[userId].freeMargin;
    if (freeMargin >= margin) {
      Userbalances[asset] = {
        USD: USD,
        freeMargin: freeMargin - margin
      }
      return false;
    }
    await redis.xdel("prices-stream", id);
  } else {
    console.log("we cannot find the balance for this userId");
    await redis.xdel("prices-stream", id);
    return false;
  }
  return true;
};
export const closeOrderCheck = async (
  orderId: string,
  userId: string,
  id: string,
  asset: string,
) => {
  if (!openTrades[userId]) {
    return 0;
  } else {
    const findOrderId = openTrades[userId].filter((trades: any) => {
      trades.orderId === orderId;
    });
    if (findOrderId) {
      Userbalances[]
      await redis.xdel("prices-stream", id);

      return 1;
    }
  }
  return 0;
};
