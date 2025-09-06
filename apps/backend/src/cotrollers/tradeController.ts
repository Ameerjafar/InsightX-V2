import { Request, Response } from "express";
const QUEUE_STREAM = "price-stream";
import { redis } from "../redisClient";
import { prisma } from "../db";
export const createTradeController = async (req: Request, res: Response) => {
  const { asset, type, margin, leverage, slippage, userId } = req.body;
  const User = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!User)
    return res
      .status(411)
      .json({ message: "we cannot find the user id the db" });
  const uid = (Date.now()).toString();
  const actualValue = margin / 10 ** 2;
  const orderUpdate = {
    asset,
    type,
    margin: actualValue,
    leverage,
    slippage,
    userId,
    orderId: uid
  };
  redis.xadd(
    QUEUE_STREAM,
    "MAXLEN",
    "~",
    "10000",
    "*",
    "createOrder",
    JSON.stringify(orderUpdate)
  );

  res.status(200).json({ orderId: uid });
};

export const closeTradeController = (req: Request, res: Response) => {
  const { orderId, userId } = req.body;
  const closeOrder = redis.xadd(
    QUEUE_STREAM,
    "MAXLEN",
    "~",
    "10000",
    "*",
    "closeOrder",
    JSON.stringify({ orderId, userId })
  );
  return res.status(200).json({message: "order went to the queue"});
};
