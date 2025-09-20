export interface SupportedAssetDef {
  symbol: string;
  name: string;
  imageUrl: string;
  decimal: number;
}

export const SUPPORTED_ASSETS: SupportedAssetDef[] = [
  { symbol: "BTC", name: "Bitcoin", imageUrl: "", decimal: 4 },
  { symbol: "ETH", name: "Ethereum", imageUrl: "", decimal: 4 },
  { symbol: "SOL", name: "Solana", imageUrl: "", decimal: 4 },
];


