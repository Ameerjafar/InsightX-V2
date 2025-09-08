import { redis, redisList, redisSnapshot } from "./redis";
import { prices, openTrades, Userbalances } from "./inMemory/data";
import { closeOrderCheck, openOrderCheck } from "./checks";

async function snapshot(kind: "trades" | "balances" | "prices") {
  const ts = Date.now();
  const SNAPSHOT_LIST = "engine-snapshots";
  const LATEST_PREFIX = "engine-latest";

  let data: any;
  if (kind === "trades") data = openTrades;
  else if (kind === "balances") data = Userbalances;
  else data = prices;

  const payload = JSON.stringify({ type: kind, ts, data });
  try {
    await (redisSnapshot as any)
      .multi()
      .lpush(SNAPSHOT_LIST, payload)
      .ltrim(SNAPSHOT_LIST, 0, 999)
      .set(`${LATEST_PREFIX}:${kind}`, payload)
      .exec();
  } catch (e) {
    console.error("snapshot failed", e);
  }
}

async function continuousReading() {
  let lastId = "$";

  while (true) {
    console.log("Engine is running...");

    try {
      const result = await redis.xread(
        "COUNT",
        "100",
        "BLOCK",
        "10000",
        "STREAMS",
        "price-stream",
        lastId
      );
      console.log("This is the result we got", result);
      if (result && result.length > 0) {
        const [_, entries] = result[0];

        for (const [id, fields] of entries) {
          const queueName = fields[0];
          const dataString = fields[1];

          try {
            console.log(`Processing: ${queueName}`);

            if (queueName === "prices-updates") {
              const priceUpdates = JSON.parse(dataString);
              console.log("Updating prices:", priceUpdates);
              console.log(priceUpdates);

              priceUpdates.forEach((data: any) => {
                prices[data.asset] = {
                  prices: data.price,
                  decimal: data.decimals,
                };
              });
              await snapshot("prices");
            } else if (queueName === "createOrder") {
              const orderData = JSON.parse(dataString);
              console.log("Processing create order:", orderData);

              const isValid = await openOrderCheck(
                orderData.margin,
                orderData.userId,
                id,
                orderData.asset,
                orderData.type
              );

              if (isValid) {
                if (!openTrades[orderData.userId]) {
                  openTrades[orderData.userId] = [];
                }

                const normalizedLeverage = Math.max(
                  1,
                  Number(orderData.leverage) || 1
                );

                const tradeData = {
                  asset: orderData.asset,
                  type: orderData.type,
                  margin: orderData.margin,
                  leverage: normalizedLeverage,
                  slippage: orderData.slippage,
                  orderId: orderData.orderId,
                  executedPrice: prices[orderData.asset]?.prices || 0,
                  timestamp: Date.now(),
                };

                openTrades[orderData.userId].push(tradeData);
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN",
                  "~",
                  "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: orderData.orderId,
                    status: "success",
                    message: "Order created successfully",
                    tradeData: tradeData,
                  })
                );

                console.log(`Order created: ${orderData.orderId}`);
                await snapshot("trades");
              } else {
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN",
                  "~",
                  "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: orderData.orderId,
                    status: "failed",
                    message:
                      "Order validation failed - insufficient margin or invalid data",
                  })
                );

                console.log(`Order failed: ${orderData.orderId}`);
              }
            } else if (queueName === "closeOrder") {
              const closeData = JSON.parse(dataString);
              console.log("Processing close order:", closeData);

              const closeResult = await closeOrderCheck(
                closeData.orderId,
                closeData.userId,
                id
              );

              if (closeResult.ok && openTrades[closeData.userId]) {
                const orderIndex = openTrades[closeData.userId].findIndex(
                  (trade) => trade.orderId === closeData.orderId
                );

                if (orderIndex !== -1) {
                  const closedTrade = openTrades[closeData.userId].splice(
                    orderIndex,
                    1
                  )[0];
                  await redis.xadd(
                    "ENGINE-REPLY",
                    "MAXLEN",
                    "~",
                    "10000",
                    "*",
                    "orderResponse",
                    JSON.stringify({
                      orderId: closeData.orderId,
                      status: "closed",
                      message: "Order closed successfully",
                      closedTrade: closedTrade,
                      pnl: closeResult.pnl ?? 0,
                    })
                  );

                  console.log(`Order closed: ${closeData.orderId}`);
                  await snapshot("trades");
                } else {
                  await redis.xadd(
                    "ENGINE-REPLY",
                    "MAXLEN",
                    "~",
                    "10000",
                    "*",
                    "orderResponse",
                    JSON.stringify({
                      orderId: closeData.orderId,
                      status: "failed",
                      message: "Order not found",
                    })
                  );
                }
              } else {
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN",
                  "~",
                  "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: closeData.orderId,
                    status: "failed",
                    message:
                      closeResult.message || "Order close validation failed",
                  })
                );

                console.log(`Order close failed: ${closeData.orderId}`);
              }
            }
          } catch (parseError) {
            console.error("Error parsing message:", parseError);
          }

          lastId = id;
        }
      }
    } catch (error) {
      console.error("Error in engine:", error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function continuousListReading() {
  const REQUEST_QUEUE = "prices-stream";
  const REPLY_QUEUE = "ENGINE-REPLY";

  while (true) {
    try {
      const popped = await (redisList as any).brpop(REQUEST_QUEUE, 5);
      if (!popped) {
        continue;
      }
      const [, payload] = popped as [string, string];
      try {
        const msg = JSON.parse(payload);
        const action = msg.action as string;
        const orderId = msg.orderId as string;
        const userId = msg.userId as string | null;

        if (!orderId) {
          continue;
        }

        if (action === "getUsdBalance") {
          if (!userId) {
            console.log("we cannot find your userId");
            await (redisList as any).lpush(
              REPLY_QUEUE,
              JSON.stringify({ orderId, error: "we cannot find your userId" })
            );
          } else if (!Userbalances[userId]) {
            console.log("we cannot find your userId");
            await (redisList as any).lpush(
              REPLY_QUEUE,
              JSON.stringify({ orderId, error: "we cannot find your userId" })
            );
          } else {
            await (redisList as any).lpush(
              REPLY_QUEUE,
              JSON.stringify({ orderId, balance: Userbalances[userId].USD })
            );
          }
        } else if (action === "getBalances") {
          if (!userId || !Userbalances[userId]) {
            console.log("we cannot find your userId");
            await (redisList as any).lpush(
              REPLY_QUEUE,
              JSON.stringify({ orderId, error: "we cannot find your userId" })
            );
          } else {
            const user = Userbalances[userId];
            const balances: Record<
              string,
              { balance: number; decimals: number }
            > = {};
            Object.keys(prices).forEach((asset) => {
              const bal = (user.assets && user.assets[asset]) || 0;
              balances[asset] = {
                balance: bal,
                decimals: prices[asset].decimal,
              };
            });
            await (redisList as any).lpush(
              REPLY_QUEUE,
              JSON.stringify({ orderId, balances })
            );
            await snapshot("balances");
          }
        } else if (action === "getSupportedAssets") {
          const assets = Object.keys(prices);
          await (redisList as any).lpush(
            REPLY_QUEUE,
            JSON.stringify({ orderId, assets })
          );
        } else {
        }
      } catch (e) {}
    } catch (err) {
      console.error("Error in list listener:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

continuousReading();
continuousListReading();

function startSnapshotTicker() {
  const FIVE_SECONDS = 5000;
  setInterval(() => {
    snapshot("trades");
    snapshot("balances");
    snapshot("prices");
  }, FIVE_SECONDS);
}

startSnapshotTicker();
