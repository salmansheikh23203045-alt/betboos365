/** "৳1,250.00": the taka sign with two decimals and thousands separators. */
export function formatBdt(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}৳${abs}`;
}
