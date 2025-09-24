import { useState, useEffect, useRef } from "react";

export type PriceValue = [number, boolean];

export interface PriceData {
  BTC: { bid: PriceValue; ask: PriceValue };
  ETH: { bid: PriceValue; ask: PriceValue };
  SOL: { bid: PriceValue; ask: PriceValue };
}

export const usePricePoller = () => {
  const [prices, setPrices] = useState<PriceData>({
    BTC: { bid: [0, false], ask: [0, false] },
    ETH: { bid: [0, false], ask: [0, false] },
    SOL: { bid: [0, false], ask: [0, false] },
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws; 

      ws.onopen = () => {
        console.log("Connected to WebSocket:", WS_URL);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "bookTicker" && data.data) {
            const { symbol, bookTicker }: { symbol: string; bookTicker: { bidPrice: string | number; askPrice: string | number } } = data.data;
            const baseSymbol = (symbol || "").replace(/USDT$/i, "").toUpperCase();
            const bid = Number(bookTicker?.bidPrice);
            const ask = Number(bookTicker?.askPrice);
            if (!(["BTC", "ETH", "SOL"].includes(baseSymbol)) || Number.isNaN(bid) || Number.isNaN(ask)) {
              return;
            }
            setPrices((prev) => {
              if (!(baseSymbol in prev)) return prev;
              const symbolKey = baseSymbol as keyof PriceData;
              const prevBid = prev[symbolKey].bid[0];
              const prevAsk = prev[symbolKey].ask[0];

              if (prevBid === bid && prevAsk === ask) return prev;

              return {
                ...prev,
                [symbolKey]: {
                  bid: [bid, bid > prevBid],
                  ask: [ask, prevAsk > ask],
                },
              };
            });
          }
        } catch (e) {
          console.warn("Failed to parse WS message", e);
        }
      };

      ws.onerror = (err) => {
        console.log("WebSocket error:", err);
      };
      ws.onclose = () => {
        console.log("WebSocket closed, scheduling reconnect...");
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const delay = Math.min(5000, 500 * attempt);
        setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, delay);
      };
    };

    connect();

    return () => wsRef.current?.close();
  }, []);

  return prices;
};