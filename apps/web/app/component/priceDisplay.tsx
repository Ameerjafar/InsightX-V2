import { usePricePoller } from "../hooks/usePoller";

export const PriceDisplay = ({
  selectedSymbol,
}: {
  selectedSymbol: string;
}) => {
  const prices = usePricePoller();
  console.log("hello price display", prices);

  const symbol = selectedSymbol.replace("USDT", "") as "BTC" | "ETH" | "SOL";

  const bidPrice = prices[symbol]?.bid[0] ?? 0;
  const askPrice = prices[symbol]?.ask[0] ?? 0;
  const bidDirection = prices[symbol]?.bid[1] ?? false;
  const askDirection = prices[symbol]?.ask[1] ?? false;

  return (
    <div className="flex space-x-10">
      <div>
        <div className="text-sm text-gray-400 mb-1">BID (Buy)</div>
        <div
          className={`text-2xl font-bold transition-colors duration-300 ${
            bidDirection ? "text-red-500" : "text-green-500"
          }`}
        >
          ${bidPrice.toFixed(2)}
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-400 mb-1">ASK (Sell)</div>
        <div
          className={`text-2xl font-bold transition-colors duration-300 ${
            askDirection ? "text-red-500" : "text-green-500"
          }`}
        >
          ${askPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
