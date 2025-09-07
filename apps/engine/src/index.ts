import { redis } from "./redis";
import { prices, openTrades } from "./inMemory/data";
import { closeOrderCheck, openOrderCheck } from "./checks";

async function continuousReading() {
  let lastId = "$";
  
  while (true) {
    console.log("Engine is running...");
    
    try {
      const result = await redis.xread(
        "COUNT", "100",
        "BLOCK", "10000", 
        "STREAMS", "price-stream",
        lastId
      );
      console.log("This is the result we got", result)
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
              console.log(priceUpdates)

              priceUpdates.forEach((data: any) => {
                prices[data.asset] = {
                  prices: data.price,
                  decimal: data.decimals,
                };
              });
              
            } else if (queueName === "createOrder") {
              const orderData = JSON.parse(dataString);
              console.log("Processing create order:", orderData);

              const isValid = await openOrderCheck(orderData.margin, orderData.userId, id, orderData.asset, orderData.type);
              
              if (isValid) {
                if (!openTrades[orderData.userId]) {
                  openTrades[orderData.userId] = [];
                }
                
                const tradeData = {
                  asset: orderData.asset,
                  type: orderData.type,
                  margin: orderData.margin,
                  leverage: orderData.leverage,
                  slippage: orderData.slippage,
                  orderId: orderData.orderId,
                  executedPrice: prices[orderData.asset]?.prices || 0,
                  timestamp: Date.now()
                };
                
                openTrades[orderData.userId].push(tradeData);
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN", "~", "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: orderData.orderId,
                    status: "success",
                    message: "Order created successfully",
                    tradeData: tradeData
                  })
                );
                
                console.log(`Order created: ${orderData.orderId}`);
              } else {
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN", "~", "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: orderData.orderId,
                    status: "failed",
                    message: "Order validation failed - insufficient margin or invalid data"
                  })
                );
                
                console.log(`Order failed: ${orderData.orderId}`);
              }
              
            } else if (queueName === "closeOrder") {
              const closeData = JSON.parse(dataString);
              console.log("Processing close order:", closeData);
              
              const canClose = await closeOrderCheck(closeData.orderId, closeData.userId, id);
              
              if (canClose && openTrades[closeData.userId]) {
                const orderIndex = openTrades[closeData.userId].findIndex(
                  (trade) => trade.orderId === closeData.orderId
                );
                
                if (orderIndex !== -1) {
                  const closedTrade = openTrades[closeData.userId].splice(orderIndex, 1)[0];
                  await redis.xadd(
                    "ENGINE-REPLY",
                    "MAXLEN", "~", "10000",
                    "*",
                    "orderResponse",
                    JSON.stringify({
                      orderId: closeData.orderId,
                      status: "closed",
                      message: "Order closed successfully",
                      closedTrade: closedTrade
                    })
                  );
                  
                  console.log(`Order closed: ${closeData.orderId}`);
                } else {
                  await redis.xadd(
                    "ENGINE-REPLY",
                    "MAXLEN", "~", "10000",
                    "*",
                    "orderResponse",
                    JSON.stringify({
                      orderId: closeData.orderId,
                      status: "failed",
                      message: "Order not found"
                    })
                  );
                }
              } else {
                await redis.xadd(
                  "ENGINE-REPLY",
                  "MAXLEN", "~", "10000",
                  "*",
                  "orderResponse",
                  JSON.stringify({
                    orderId: closeData.orderId,
                    status: "failed",
                    message: "Order close validation failed"
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

continuousReading();

