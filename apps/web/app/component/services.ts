import axios from "axios";

export interface OpenTrade {
  crypto: string;
  cryptoValue: number;
  quantity: number;
  type: "BUY" | "SELL";
}

export const fetchOpenData = async (): Promise<OpenTrade[]> => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000"}/api/v1/trade/getTrade?userId=${userId}`
    );
    
    return response.data.trades || [];
  } catch (error) {
    console.error("Error fetching open trades:", error);
    return [];
  }
};

export const calculateProfitLoss = (
  cryptoValue: number,
  quantity: number,
  type: "BUY" | "SELL",
  currentBid: number,
  currentAsk: number
): number => {
  if (currentBid === 0 || currentAsk === 0) return 0;

  const currentPrice = type === "BUY" ? currentBid : currentAsk;
  const entryPrice = cryptoValue / quantity;
  
  if (type === "BUY") {
    return (currentPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - currentPrice) * quantity;
  }
};


export interface OpenTradeRequest {
  asset: "BTC" | "ETH" | "SOL";
  type: "BUY" | "SELL";
  margin: number;
  quantity: number;
  leverage: number;
}

export const openTrade = async (payload: OpenTradeRequest) => {
  console.log("inside the open handler");
  const backend = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("User not authenticated: missing userId");
  }

  const response = await axios.post(`${backend}/api/v1/trade/create`, {
    asset: payload.asset,
    type: payload.type,
    margin: payload.margin,
    quantity: payload.quantity,
    leverage: payload.leverage,
    userId,
  });

  return response.data as {
    orderId: string;
    success: boolean;
    message: string;
    tradeData?: unknown;
  };
};

export const closeTrade = async (orderId: string) => {
  const backend = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
  const userId = localStorage.getItem("userId");
  if (!userId) {
    throw new Error("User not authenticated: missing userId");
  }

  const response = await axios.post(`${backend}/api/v1/trade/close`, {
    orderId,
    userId,
  });

  return response.data as {
    orderId: string;
    success: boolean;
    message: string;
    closedTrade?: unknown;
  };
};