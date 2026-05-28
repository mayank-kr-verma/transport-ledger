// Money stored as paise (integer). Convert at boundaries.

export const toPaise = (rupees: number | string): number => {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (!isFinite(n)) return 0;
  return Math.round(n * 100);
};

export const toRupees = (paise: number): number => (paise || 0) / 100;

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const fmtINR = (paise: number): string => inrFmt.format(toRupees(paise));

// 12,34,567 style (no symbol)
const numFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
export const fmtNum = (paise: number): string => numFmt.format(toRupees(paise));

export const fmtSigned = (paise: number): string => {
  if (paise === 0) return fmtINR(0);
  return (paise > 0 ? "" : "-") + fmtINR(Math.abs(paise));
};
