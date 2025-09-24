export interface Candle {
  x: number; // timestamp
  y: [number, number, number, number]; // [open, high, low, close]
}

// Generate realistic price movements based on current market prices
const generateCandles = (
  basePrice: number,
  volatility: number,
  count: number,
  intervalMs: number
): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * intervalMs;
    
    // Generate realistic OHLC data
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const close = Math.max(0.01, open + change);
    
    // High and low should encompass both open and close
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.3;
    
    candles.push({
      x: timestamp,
      y: [open, high, low, close]
    });
    
    currentPrice = close;
  }
  
  return candles;
};

// BTC data - around $65,000 with moderate volatility
const btcCandles = generateCandles(65000, 0.02, 100, 60000); // 100 candles, 1-minute intervals

// ETH data - around $3,200 with moderate volatility  
const ethCandles = generateCandles(3200, 0.025, 100, 60000);

// SOL data - around $180 with higher volatility
const solCandles = generateCandles(180, 0.03, 100, 60000);

export const getDummyData = (symbol: string): Candle[] => {
  switch (symbol) {
    case "BTCUSDT":
      return btcCandles;
    case "ETHUSDT":
      return ethCandles;
    case "SOLUSDT":
      return solCandles;
    default:
      return btcCandles;
  }
};

// Default data for initial load
export const defaultDummyData = btcCandles;

// Additional utility functions for more realistic data
export const generateTrendingCandles = (
  basePrice: number,
  trendDirection: 'up' | 'down' | 'sideways',
  count: number,
  intervalMs: number
): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * intervalMs;
    const progress = i / count;
    
    // Apply trend
    let trendMultiplier = 1;
    switch (trendDirection) {
      case 'up':
        trendMultiplier = 1 + progress * 0.1; // 10% upward trend
        break;
      case 'down':
        trendMultiplier = 1 - progress * 0.1; // 10% downward trend
        break;
      case 'sideways':
        trendMultiplier = 1 + Math.sin(progress * Math.PI * 4) * 0.05; // Oscillating
        break;
    }
    
    const open = currentPrice;
    const volatility = 0.015 * currentPrice;
    const change = (Math.random() - 0.5) * volatility;
    const close = Math.max(0.01, open + change) * trendMultiplier;
    
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      x: timestamp,
      y: [open, high, low, close]
    });
    
    currentPrice = close;
  }
  
  return candles;
};

// More sophisticated dummy data with different market conditions
export const getAdvancedDummyData = (symbol: string, marketCondition: 'bull' | 'bear' | 'sideways' = 'sideways'): Candle[] => {
  const basePrices = {
    "BTCUSDT": 65000,
    "ETHUSDT": 3200,
    "SOLUSDT": 180
  };
  
  const basePrice = basePrices[symbol as keyof typeof basePrices] || 65000;
  
  // Map market conditions to trend directions
  const trendDirection = marketCondition === 'bull' ? 'up' : marketCondition === 'bear' ? 'down' : 'sideways';
  
  return generateTrendingCandles(basePrice, trendDirection, 100, 60000);
};
