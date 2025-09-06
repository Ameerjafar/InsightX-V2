import { redis } from "./redis";
import { prices, openTrades } from "./data";
import { closeOrderCheck, openOrderCheck } from "./checks";
async function continuosReading() {
  let lastId = "$";
  while (true) {
    console.log("it is running inside the loop");
    const result = await redis.xread(
      "COUNT",
      "100",
      "BLOCK",
      "0",
      "STREAMS",
      "price-stream",
      lastId
    );
    if (result && result.length > 0) {
      const [_, entries] = result[0];
      for (const [id, fields] of entries) {
        const queueName = fields[0];
        for (let i = 1; i < fields.length; i++) {
          const parsed = JSON.parse(fields[i]);
          if (queueName === "prices-updates") {
            console.log("inside the price updates");
            parsed.forEach((data: any) => {
              prices[data.asset] = {
                prices: data.price,
                decimal: data.decimals,
              };
            });
          } else if (fields[0] === "createOrder") {
            parsed.forEach(async (data: any) => {
              if (await openOrderCheck(data.margin, data.userId, id)) {
                const allData = {
                  asset: data.asset,
                  type: data.type,
                  margin: data.margin,
                  leverage: data.leverage,
                  slippage: data.slippage,
                  orderId: data.orderId,
                };
                openTrades[data.userId].push(allData);
              }
            });
          } else {
            parsed.forEach(async (data: any) => {
              if (await closeOrderCheck(data.orderId, data.userId, id)) {
                openTrades[data.userId] = openTrades[data.userId].filter(
                  (element) => {
                    element.orderId !== data.orderId;
                  }
                );
              }
            });
          }
        }
        lastId = id;
      }
    }
    console.log("This is the prices", prices);
  }
}

continuosReading();
