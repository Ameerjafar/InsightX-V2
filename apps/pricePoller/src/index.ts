import { WebSocket } from "ws";
import { redis } from './redis';

const backpackWs = new WebSocket("wss://ws.backpack.exchange/");
console.log(process.env.REDIS_URL);

const priceMap = new Map<string, any>();

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
  try {
    const message = JSON.parse(event.data as string);
    
    if (message.data && message.data.s && message.data.b) {
      const symbol: string = message.data.s.slice(0, 3);
      const bidPrice = parseFloat(message.data.b);
      
      priceMap.set(symbol, {
        price: bidPrice,
        decimal: decimalPoint[symbol],
      });
      
      console.log(`Updated price for ${symbol}: ${bidPrice}`);
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
};

backpackWs.onclose = () => {
  console.log("WebSocket connection closed");
};

backpackWs.onerror = (error) => {
  console.log("WebSocket error:", error);
};

setInterval(async () => {
  if (priceMap.size === 0) {
    console.log("Price map is empty, waiting for data...");
    return;
  }

  try {
    const planObject = Object.fromEntries(priceMap);
    const entries = Object.entries(planObject);
    
    const priceUpdates = entries.map(([asset, priceInfo]: [string, any]) => {
      return {
        asset: asset,
        price: Math.round(priceInfo.price * 10 ** priceInfo.decimal),
        decimals: priceInfo.decimal
      };
    });

    await redis.xadd(
      'price-stream', 
      'MAXLEN', '~', '10000', 
      '*', 
      "prices-updates", 
      JSON.stringify(priceUpdates)
    );
    
    console.log("Price updates stored in queue:", priceUpdates);
  } catch (error) {
    console.error("Error sending price updates:", error);
  }
}, 100); 

