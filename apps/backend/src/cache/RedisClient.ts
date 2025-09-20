

import { createClient, RedisClientType } from "redis";


export class RedisClient {
    private publisher: RedisClientType;
    private subscriber: RedisClientType;

    constructor(private url: string) {
        this.publisher = createClient({url: this.url});
        this.subscriber = createClient({url: this.url});
    }
    async connect() {
        this.publisher.connect();
        this.subscriber.connect();
    }
    async publish(channelName: string, message: string) {
        await this.publisher.publish(channelName, message);
        console.log("this is the message we have published", message);
    }
    async subscribe(channel: string, handler: (message: string) => void) {
        await this.subscriber.subscribe(channel, (message) => {
          console.log(`🔔 Received from [${channel}]: ${message}`);
          handler(message);
        });
      }

}