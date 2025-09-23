import { Request, Response } from "express";
import { prisma } from "../db";
import { SUPPORTED_ASSETS } from "../assets";

const MOCK_PRICES = {
  BTC: 45000,
  ETH: 2800,
  SOL: 95
};

const MOCK_PRICE_CHANGES = {
  BTC: 0.02, 
  ETH: -0.015, 
  SOL: 0.05 
};

export const getPrices = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    
    let assetsToFetch = SUPPORTED_ASSETS;
    if (symbols) {
      const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
      assetsToFetch = SUPPORTED_ASSETS.filter(asset => 
        symbolArray.includes(asset.symbol)
      );
    }

    const prices = assetsToFetch.map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      price: MOCK_PRICES[asset.symbol as keyof typeof MOCK_PRICES] || 0,
      change24h: MOCK_PRICE_CHANGES[asset.symbol as keyof typeof MOCK_PRICE_CHANGES] || 0,
      change24hPercent: (MOCK_PRICE_CHANGES[asset.symbol as keyof typeof MOCK_PRICE_CHANGES] || 0) * 100,
      timestamp: new Date().toISOString()
    }));

    res.status(200).json({ prices });
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPriceHistory = async (req: Request, res: Response) => {
  try {
    const { symbol, hours = 24 } = req.query;
    
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const asset = SUPPORTED_ASSETS.find(a => a.symbol === symbol);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const currentPrice = MOCK_PRICES[symbol as keyof typeof MOCK_PRICES] || 0;
    const hoursNum = parseInt(hours as string) || 24;
    const dataPoints = Math.min(hoursNum, 100); 
    
    const history = [];
    const now = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Hourly data
      const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% random variation
      const price = currentPrice * (1 + randomVariation);
      
      history.push({
        timestamp: timestamp.toISOString(),
        price: Math.round(price * 100) / 100,
        volume: Math.random() * 1000000 // Mock volume
      });
    }

    res.status(200).json({ 
      symbol,
      history,
      currentPrice,
      change24h: MOCK_PRICE_CHANGES[symbol as keyof typeof MOCK_PRICE_CHANGES] || 0
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
