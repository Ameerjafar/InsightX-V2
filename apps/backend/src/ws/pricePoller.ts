import { WebSocketServer } from "ws";
import Redis from "ioredis";

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server listening on ws://localhost:8080");
const redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_CLIENT ||
  "rediss://default:AVNS_PINvzIFabRqfD-f4S_M@valkey-203008eb-ameerjafar123-f2d0.d.aivencloud.com:12091";
const redis = new Redis(redisUrl);

function broadcast(data: unknown) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

async function streamPricesToClients() {
  let lastId = "$";
  while (true) {
    try {
      const result = await redis.xread(
        "COUNT",
        100,
        "BLOCK",
        10000,
        "STREAMS",
        "price-stream",
        lastId
      );

      if (!result || result.length === 0) {
        continue;
      }

      const [, entries] = result[0];
      for (const [id, fields] of entries as any[]) {
        try {
          const fieldName = fields[0];
          const fieldValue = fields[1];
          if (fieldName !== "prices-updates") {
            lastId = id;
            continue;
          }

          const updates = JSON.parse(fieldValue) as Array<{
            asset: string;
            price: number;
            decimals: number;
          }>;
          for (const u of updates) {
            const symbol = u.asset as "BTC" | "ETH" | "SOL";
            const priceFloat = u.price / Math.pow(10, u.decimals);
            const askFloat = priceFloat * 1.0002;
            broadcast({
              type: "bookTicker",
              data: {
                symbol,
                bookTicker: {
                  bidPrice: Number(
                    priceFloat.toFixed(u.decimals >= 4 ? 4 : u.decimals)
                  ),
                  askPrice: Number(
                    askFloat.toFixed(u.decimals >= 4 ? 4 : u.decimals)
                  ),
                },
              },
            });
          }
        } catch (e) {}
        lastId = id;
      }
    } catch (err) {
      console.error("Error reading price-stream:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function streamEngineRepliesToClients() {
  let lastId = "$";
  while (true) {
    try {
      const result = await redis.xread(
        "COUNT",
        100,
        "BLOCK",
        10000,
        "STREAMS",
        "ENGINE-REPLY",
        lastId
      );

      if (!result || result.length === 0) {
        continue;
      }

      const [, entries] = result[0];
      for (const [id, fields] of entries as any[]) {
        try {
          const fieldName = fields[0];
          const fieldValue = fields[1];

          if (fieldName !== "orderResponse") {
            lastId = id;
            continue;
          }

          const payload = JSON.parse(fieldValue);
          broadcast({ type: "orderResponse", data: payload });
        } catch (e) {}
        lastId = id;
      }
    } catch (err) {
      console.error("Error reading ENGINE-REPLY stream:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

streamPricesToClients();
streamEngineRepliesToClients();

wss.on("close", () => console.log("A client closed the ws connection"));
wss.on("error", (error) => console.log("WS server error", error));
