import axios from "axios";

export interface OpenTrade {
  crypto: string;
  cryptoValue: number;
  quantity: number;
  type: "BUY" | "SELL";
}

export const fetchOpenData = async (): Promise<OpenTrade[]> => {
  try {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000"}/api/v1/trade/open?email=${userEmail}`
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
    // For BUY orders, profit when current price > entry price
    return (currentPrice - entryPrice) * quantity;
  } else {
    // For SELL orders, profit when current price < entry price
    return (entryPrice - currentPrice) * quantity;
  }
};
