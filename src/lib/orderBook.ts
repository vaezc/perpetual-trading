export type BookSide = "bids" | "asks";

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export function getBucketDecimals(bucketSize: number): number {
  const decimalPart = bucketSize.toString().split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

export function aggregateByBucket(
  levels: OrderBookLevel[],
  side: BookSide,
  bucketSize: number,
): OrderBookLevel[] {
  const decimals = getBucketDecimals(bucketSize);
  const bucketed = new Map<string, number>();

  levels.forEach((level) => {
    const price = Number(level.price);
    const quantity = Number(level.quantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity)) return;

    const bucketPrice =
      side === "bids"
        ? Math.floor(price / bucketSize) * bucketSize
        : Math.ceil(price / bucketSize) * bucketSize;
    const key = bucketPrice.toFixed(decimals);
    bucketed.set(key, (bucketed.get(key) ?? 0) + quantity);
  });

  return Array.from(bucketed.entries())
    .map(([price, quantity]) => ({ price, quantity: quantity.toString() }))
    .sort((a, b) =>
      side === "bids" ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price),
    );
}

