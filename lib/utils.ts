export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ethToWei(eth: string): bigint {
  const parts = eth.split(".");
  const whole = parts[0] || "0";
  const frac = (parts[1] || "").padEnd(18, "0").slice(0, 18);
  return BigInt(whole) * BigInt(10 ** 18) + BigInt(frac);
}

export function basescanUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

export function warpcastComposeUrl(text: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
}
