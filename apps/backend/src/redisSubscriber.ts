
import { createClient, RedisClientType } from "redis";
import { STREAMS } from './config'
const REPLY_QUEUE_NAME = "ENGINE-REPLY";

export class RedisSubscriber {
  private client: RedisClientType;
  private callbacks: Record<string, any>;
  private isListening: boolean = false;
  private static instance: RedisSubscriber;

  constructor(private url: string) {
    this.callbacks = {};
    this.client = createClient({
      url: url,
    });
    this.connect();
  }
  static getInstance(url: string): RedisSubscriber {
    if (!RedisSubscriber.instance) {
      RedisSubscriber.instance = new RedisSubscriber(url);
    }
    return RedisSubscriber.instance;
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log("Redis Subscriber connected successfully");
    } catch (error) {
      console.error("Failed to connect Redis Subscriber:", error);
      throw error;
    }
  }
  waitForMessage(orderId: string, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      this.callbacks[orderId] = resolve;

      if (Object.keys(this.callbacks).length === 1) {
        this.startListening();
      }
      const timeoutId = setTimeout(() => {
        if (this.callbacks[orderId]) {
          delete this.callbacks[orderId];
          reject(
            new Error(`Timeout waiting for order ${orderId} after ${timeout}ms`)
          );
        }
      }, timeout);
      this.callbacks[orderId].timeoutId = timeoutId;
    });
  }
  private async startListening() {
    if (this.isListening) return;
    this.isListening = true;

    let lastId = "$";

    while (Object.keys(this.callbacks).length >= 1) {
      try {
        const response = await this.client.xRead(
          { key: REPLY_QUEUE_NAME , id: lastId },
          { COUNT: 100, BLOCK: 1000 }
        );

        if (response && response.length > 0) {
          for (const stream of response) {
            for (const message of stream.messages) {
              const messageData: Record<string, string> = message.message as any;

              // Engine writes { orderResponse: '{"orderId":..., ...}' }
              const payloadRaw = messageData["orderResponse"];
              let payload: any = null;
              if (payloadRaw) {
                try {
                  payload = JSON.parse(payloadRaw);
                } catch (e) {
                  payload = null;
                }
              }

              const oid = (payload && payload.orderId) || (messageData as any).orderId;

              if (oid && this.callbacks[oid]) {
                if (this.callbacks[oid].timeoutId) {
                  clearTimeout(this.callbacks[oid].timeoutId);
                }
                // Resolve with parsed payload if available, else raw message
                this.callbacks[oid](payload ?? messageData);
                delete this.callbacks[oid];
              }

              lastId = message.id;
            }
          }
        }
      } catch (error) {
        console.error("Error reading from Redis reply stream:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.isListening = false;
    console.log("Stopped listening - no more callbacks pending");
  }

  getPendingCallbacksCount(): number {
    return Object.keys(this.callbacks).length;
  }

  cancelWaitForMessage(orderId: string): boolean {
    if (this.callbacks[orderId]) {
      if (this.callbacks[orderId].timeoutId) {
        clearTimeout(this.callbacks[orderId].timeoutId);
      }
      delete this.callbacks[orderId];
      return true;
    }
    return false;
  }
  isConnected(): boolean {
    return this.client.isReady;
  }

  async disconnect(): Promise<void> {
    try {
      Object.keys(this.callbacks).forEach((orderId) => {
        if (this.callbacks[orderId].timeoutId) {
          clearTimeout(this.callbacks[orderId].timeoutId);
        }
      });
      this.callbacks = {};
      this.isListening = false;

      await this.client.quit();
      console.log("Redis Subscriber disconnected");
    } catch (error) {
      console.error("Error disconnecting Redis Subscriber:", error);
      throw error;
    }
  }
}
