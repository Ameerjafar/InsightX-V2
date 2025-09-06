import { Userbalances, openTrades } from "./data";
import { redis } from "./redis";

export const openOrderCheck = async (
  margin: number,
  userId: string,
  id: string
) => {
  if (Userbalances[userId]) {
    const freeMargin = Userbalances[userId].freeMargin;
    if (freeMargin < margin) {
      await redis.xdel("prices-stream", id);
      return false;
    }
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
  id: string
) => {
  if (!openTrades[userId]) {
    return 0;
  } else {
    const findOrderId = openTrades[userId].filter((trades: any) => {
      trades.orderId === orderId;
    });
    if (findOrderId) {
      await redis.xdel("prices-stream", id);
      return 1;
    }
  }
  return 0;
};
