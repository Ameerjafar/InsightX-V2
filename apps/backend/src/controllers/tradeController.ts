import { Request, Response } from "express";
import Redis from "ioredis";
import { RedisSubscriber } from "../redisSubscriber";
import { prisma } from "../db";
import { REDIS_CONFIG } from "../config";

const PRICE_STREAM = "price-stream";

const redisPublisher = new Redis(REDIS_CONFIG.url);
const redisSubscriber = RedisSubscriber.getInstance(REDIS_CONFIG.url);

export const createTradeController = async (req: Request, res: Response) => {
  try {
    const { asset, type, liquidated, userId, quantity, leverage, price } =
      req.body;
    const slippage = 0.1;

    if (!asset || !type || !userId || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: asset, type, userId, or quantity",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orderId = Date.now().toString();

    const orderUpdate = {
      asset,
      type,
      slippage,
      userId,
      orderId,
      ...(leverage ? { leverage } : {}),
      price,
    };

    console.log("Sending order to engine:", orderUpdate);

    const result = {
      message: "Trade created",
      tradeData: { liquidated: Boolean(liquidated) },
    };

    try {
      await prisma.existingTrades.create({
        data: {
          type,
          price,
          quantity,
          slippage,
          userId,
          liquidated: Boolean(liquidated),
          ...(liquidated && leverage ? { leverage } : {}),
        },
      });
    } catch (err) {
      console.error("Error saving trade to database:", err);
    }

    return res.status(200).json({
      orderId,
      success: true,
      message: result.message,
      tradeData: result.tradeData,
      price,
    });
  } catch (err: unknown) {
    console.error("Unexpected error in createTradeController:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};
const redisClient = new Redis(REDIS_CONFIG.url);

export const closeTradeController = async (req: Request, res: Response) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId or userId",
      });
    }

    // 1️⃣ Fetch the trade to close
    const trade = await prisma.existingTrades.findUnique({
      where: { id: String(orderId) },
    });

    if (!trade || trade.userId !== String(userId)) {
      return res.status(404).json({
        success: false,
        message: "Trade not found or already closed",
      });
    }

    // 2️⃣ Fetch current market price from Redis
    let currentPrice = 0;
    try {
      const streamData = await redisClient.xrevrange(
        PRICE_STREAM,
        "+",
        "-",
        "COUNT",
        1
      );

      if (streamData && streamData.length > 0) {
        const latestEntry = streamData[0][1];
        const pricesStr = latestEntry[1]; // ["prices-updates", "[...json...]"]
        const pricesArray = JSON.parse(pricesStr as string);

        const assetPriceObj = pricesArray.find(
          (p: any) => p.asset === trade.asset
        );
        if (assetPriceObj) {
          currentPrice = assetPriceObj.price;
        }
      }
    } catch (err) {
      console.error("Error fetching current price from Redis:", err);
    }

    // 3️⃣ Calculate P&L
    // Assuming: P&L = (currentPrice - trade.price) * quantity * leverage (if any)
    let pnl = 0;
    try {
      const effectiveLeverage = trade.leverage || 1;
      pnl = (currentPrice - trade.price) * trade.quantity * effectiveLeverage;
    } catch (err) {
      console.error("Error calculating P&L:", err);
      pnl = 0;
    }

    // 4️⃣ Delete the trade
    try {
      await prisma.existingTrades.delete({
        where: { id: String(orderId) },
      });
    } catch (err) {
      console.error("Error deleting trade from database:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to close trade",
      });
    }

    return res.status(200).json({
      orderId,
      success: true,
      message: "Trade closed successfully",
      pnl,
      closedTrade: {
        ...trade,
        currentPrice,
        pnl,
      },
    });
  } catch (err) {
    console.error("Unexpected error in closeTradeController:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

export const getAllTrades = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    let trades: any[] = [];
    try {
      trades = await prisma.existingTrades.findMany({
        where: { userId: String(userId) },
      });
    } catch (err) {
      console.error("Error fetching trades from database:", err);
    }

    return res.status(200).json({ trades });
  } catch (err) {
    console.error("Unexpected error in getAllTrades:", err);
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : err });
  }
};
