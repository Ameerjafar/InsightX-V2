
type Asset = "BTC" | "SOL" | "ETH";

export type PriceObject = Record<Asset, {
    price: number;
    decimal: number;
}>;