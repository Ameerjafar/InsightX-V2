import { WebSocket } from "ws";
import { redis } from './redis';
const backpackWs = new WebSocket("wss://ws.backpack.exchange/");
console.log(process.env.REDIS_URL);

const priceMap = new Map<string, {}>();

export const decimalPoint: Record<string, number> = {
  "SOL": 6,
  "BTC": 4,
  "ETH": 6,
};
backpackWs.onopen = (event) => {
  console.log("Connection opened successfully");
  const subscribeMessage = {
    method: "SUBSCRIBE",
    params: [
      "bookTicker.SOL_USDC",
      "bookTicker.ETH_USDC",
      "bookTicker.BTC_USDC",
    ],
  };
  backpackWs.send(JSON.stringify(subscribeMessage));
};
backpackWs.onmessage = async (event) => {
  const message = JSON.parse(event.data as string);

  const symbol: string = message.data.s.slice(0, 3);
  const bidPrice = message.data.b;
  priceMap.set(symbol, {
    price: bidPrice,
    decimal: decimalPoint[symbol],
  });
};
backpackWs.onclose = () => {
  console.log("WebSocket connection closed");
};
backpackWs.onerror = (error) => {
  console.log("This is error facing by the websocket connection", error);
};

setInterval(async () => {
  if(!priceMap) {
    console.log("The price map does not have the value", priceMap);
  }
  else {
    const planObject = Object.fromEntries(priceMap);
    const entries = Object.entries(planObject);
    const priceUpdates = entries.map((entry: any) => {
      return {
          asset: entry[0],
          price: Math.round(entry[1]['price'] * 10 ** entry[1].decimal),
          decimals: entry[1].decimal
      };
  });
    redis.xadd('price-stream', 'MAXLEN', '~', '10000', '*',"prices-updates",JSON.stringify(priceUpdates));
    console.log("it is stored in the queue")
  }
}, 100);
