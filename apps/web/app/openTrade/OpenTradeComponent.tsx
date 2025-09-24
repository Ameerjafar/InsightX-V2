"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { usePricePoller } from "../hooks/usePoller";
import toast from "react-hot-toast";
import { calculateProfitLoss, fetchOpenData, OpenTrade } from "../component/services";

export const OpenTradeComponent = () => {
  const [allOpenTrades, setAllOpenTrades] = useState<OpenTrade[] | null>(
    null
  ); 
  const [closingTrades, setClosingTrades] = useState<Set<number>>(new Set()); 
  const [isLoading, setIsLoading] = useState(true); 
  const prices = usePricePoller();

  useEffect(() => {
    const allTradesController = async () => {

      const openTrades = await fetchOpenData();
      if (!openTrades) {
        setAllOpenTrades([]);
      } else {
        setAllOpenTrades(openTrades);
      }
      setIsLoading(false);
    };
    allTradesController();
  }, []);

  const closeHandler = async (
    tradeIndex: number,
    orderId: string
  ) => {

    setClosingTrades((prev) => new Set([...prev, tradeIndex]));
    const startTime = performance.now();
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      const userId = localStorage.getItem("userId");
      await axios.post(
        `${backend}/api/v1/trade/close`,
        {
          orderId,
          userId,
        }
      );
      const endTime = performance.now();
      console.log("This is the performace when closing the order", endTime - startTime, "ms");
      toast.success("Order closed successfully!");

      setAllOpenTrades((prev) => prev ? prev.filter((_, index) => index !== tradeIndex) : []);
    } catch (error) {
      console.error("Error closing order:", error);
      toast.error("Failed to close order");
    } finally {
      setClosingTrades((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tradeIndex);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading trades...</span>
      </div>
    );
  }

  if (!allOpenTrades || allOpenTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-800 rounded-full p-4 mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div className="text-center text-white font-bold text-xl pb-3">
          You have not opened any trades yet
        </div>
        <p className="text-gray-400 text-sm">
          Start trading to see your positions here
        </p>
      </div>
    );
  }

  return (
    <div>
      {allOpenTrades &&
        allOpenTrades.map((openTrade, ind) => {
          const profitLoss = calculateProfitLoss(
            openTrade.cryptoValue,
            openTrade.quantity,
            openTrade.type,
            prices[openTrade.crypto as keyof typeof prices]?.bid[0] || 0,
            prices[openTrade.crypto as keyof typeof prices]?.ask[0] || 0
          );

          const isClosing = closingTrades.has(ind);

          return (
            <div
              key={ind}
              className={`bg-[#16191D] shadow-2xl border border-gray-700 w-full text-white p-2 rounded-md mb-3 transition-opacity duration-200 ${
                isClosing ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="flex justify-between">
                <div className="text-lg font-semibold pt-3">
                  {openTrade.crypto}
                </div>
                <div className="flex space-x-5">
                  <div className="text-sm pt-2 text-gray-400">
                    <div>Entry: ${openTrade.cryptoValue.toFixed(2)}</div>
                    <div>
                      Profit:{" "}
                      <span
                        className={
                          profitLoss >= 0 ? "text-green-500" : "text-red-500"
                        }
                      >
                        ${profitLoss.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="pr-2 mt-4">
                    <div className="w-20 text-center bg-yellow-500 rounded-md p-1 text-sm">
                      {openTrade.type}
                    </div>
                  </div>
                  <div className="pr-2 mt-4">
                    <button
                      onClick={() => {
                        if (!isClosing) {
                          // Expecting each trade to include an orderId to close
                          // Fallback: disable if missing
                          const orderId = (openTrade as { orderId?: string }).orderId;
                          if (!orderId) return;
                          closeHandler(ind, orderId);
                        }
                      }}
                      disabled={isClosing}
                      className={`w-20 text-center rounded-md p-1 text-sm flex items-center justify-center transition-all duration-200 ${
                        isClosing
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-700 cursor-pointer"
                      }`}
                    >
                      {isClosing ? (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          <span className="text-xs">...</span>
                        </div>
                      ) : (
                        "Close"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
