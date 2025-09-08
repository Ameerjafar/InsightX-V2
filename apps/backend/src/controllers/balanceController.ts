import { Request, Response } from "express";
import Redis from "ioredis";
import { REDIS_CONFIG } from "../config";
import { prisma } from "../db";
import { SUPPORTED_ASSETS } from "../assets";

const REQUEST_QUEUE = "prices-stream";
const REPLY_QUEUE = "ENGINE-REPLY";

const redis = new Redis(REDIS_CONFIG.url);

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function waitForReply(correlationId: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const remainingSec = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
    const result = await redis.brpop(REPLY_QUEUE, remainingSec);
    if (!result) {
      break;
    }
    const [, payload] = result;
    try {
      const message = JSON.parse(payload);
      if (message && message.orderId === correlationId) {
        return message;
      }
      await redis.lpush(REPLY_QUEUE, payload);
    } catch {
    }
  }
  return null;
}

export const getUsdBalance = async (req: Request, res: Response) => {
  try {
    const correlationId = generateCorrelationId();
    const message = {
      orderId: correlationId,
      action: "getUsdBalance",
      userId: req.query.userId || null,
    };
    await redis.lpush(REQUEST_QUEUE, JSON.stringify(message));
    const reply = await waitForReply(correlationId, 5000);
    if (!reply) {
      return res.status(504).json({ message: "Timed out waiting for engine reply" });
    }
    if (reply.error) {
      return res.status(400).json({ message: reply.error });
    }
    return res.status(200).json({ balance: reply.balance });
  } catch (e) {
    return res.status(500).json({ message : "Internal server error" });
  }
};

export const getAssetBalances = async (req: Request, res: Response) => {
  try {
    const correlationId = generateCorrelationId();
    const message = {
      orderId: correlationId,
      action: "getBalances",
      userId: req.query.userId || null,
    };
    await redis.lpush(REQUEST_QUEUE, JSON.stringify(message));
    const reply = await waitForReply(correlationId, 5000);
    if (!reply) {
      return res.status(504).json({ message: "Timed out waiting for engine reply" });
    }
    if (reply.error) {
      return res.status(400).json({ message: reply.error });
    }
    return res.status(200).json(reply.balances || {});
  } catch (e) {
    return res.status(500).json({ message : "Internal server error" });
  }
};

export const getSupportedAssets = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.asset.findMany({ take: 1 });
    if (existing.length === 0) {
      await prisma.asset.createMany({
        data: SUPPORTED_ASSETS.map(a => ({
          symbol: a.symbol,
          name: a.name,
          imageUrl: a.imageUrl,
          decimal: a.decimal
        })),
        skipDuplicates: true
      });
    }
    const all = await prisma.asset.findMany({
      select: { symbol: true, name: true, imageUrl: true, decimal: true }
    });
    return res.status(200).json({ assets: all });
  } catch (e) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


