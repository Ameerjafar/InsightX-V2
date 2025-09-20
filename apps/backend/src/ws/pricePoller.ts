import WebSocket, { WebSocketServer } from "ws";
import { RedisClient } from '../cache/RedisClient';

const redis = new RedisClient(process.env.REDIS_CLIENT! as string);
const backpackWs = new WebSocket("wss://ws.backpack.exchange/");
const wss = new WebSocketServer({ port: 8080 });
console.log("you have successfully connected to ws 8080");
backpackWs.on("open", () => console.log("connected to backpack exchange"));

backpackWs.on("message", (data) => {
  const parsedData = JSON.parse(data.toString());
  console.log(parsedData);
});

wss.on("close", () => console.log("Your ws connection closed"));
wss.on("error", (error) => console.log("you are getting this error", error));
