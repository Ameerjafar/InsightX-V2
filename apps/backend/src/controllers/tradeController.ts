
import { Request, Response } from "express";
import Redis from "ioredis"; 
import { RedisSubscriber } from '../redisSubscriber';
import { prisma } from "../db";
import { REDIS_CONFIG } from '../config';

const PRICE_STREAM = "price-stream";

const redisPublisher = new Redis(REDIS_CONFIG.url);
const redisSubscriber = RedisSubscriber.getInstance(REDIS_CONFIG.url);

export const createTradeController = async (req: Request, res: Response) => {
  try {
    const { asset, type, margin, leverage, userId, quantity } = req.body;
    const slippage = 0.1;
    if (!asset || !type || !margin || !leverage || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(411).json({
        success: false,
        message: "User not found in database",
      });
    }

    const orderId = Date.now().toString();
    const actualValue = margin / 100;
    
    const orderUpdate = {
      asset,
      type,
      margin: actualValue,
      leverage,
      slippage: slippage,
      userId,
      orderId,
    };

    console.log("Sending order to engine:", orderUpdate);

    await redisPublisher.xadd(
      PRICE_STREAM,
      'MAXLEN', '~', '10000',
      '*',
      'action', 'createOrder',
      'data', JSON.stringify(orderUpdate),
      'orderId', orderId
    );
    const result = await redisSubscriber.waitForMessage(orderId, 10000); 

    console.log("Received engine response:", result);

    if (result.status === "success") {
      try {
        const alreadyExists = await prisma.existingTrades.findFirst({
          where: {
            userId: userId,
            orderId: orderId,
          } as any,
        });

        if (!alreadyExists) {
          await prisma.existingTrades.create({
            data: {
              orderId: orderId,
              type: type,
              margin: margin,
              quantity: quantity,
              slippage: slippage,
              assetId: asset,
              userId: userId,
            } as any,
          });
        }
      } catch (e) {
        console.error("Failed to persist/open existing trade:", e);
      }
      res.status(200).json({
        orderId,
        success: true,
        message: result.message,
        tradeData: result.tradeData,
      });
    } else {
      res.status(400).json({
        orderId,
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in createTradeController:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const closeTradeController = async (req: Request, res: Response) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId or userId",
      });
    }

    console.log("Sending close order to engine:", { orderId, userId });
    await redisPublisher.xadd(
      PRICE_STREAM,
      'MAXLEN', '~', '10000',
      '*',
      'action', 'closeOrder',
      'data', JSON.stringify({ orderId, userId }),
      'orderId', orderId
    );
    const result = await redisSubscriber.waitForMessage(orderId, 10000); 

    console.log("Received close response:", result);

    if (result.status === "closed") {
      try {
        await prisma.existingTrades.deleteMany({
          where: {
            userId: String(userId),
            orderId: String(orderId),
          } as any,
        });
      } catch (e) {
        console.error("Failed to remove existing trade on close:", e);
      }

      res.status(200).json({
        orderId,
        success: true,
        message: result.message,
        closedTrade: result.closedTrade,
      });
    } else {
      res.status(400).json({
        orderId,
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in closeTradeController:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};