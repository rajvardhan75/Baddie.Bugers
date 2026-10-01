export const CATS = ["Burgers", "Sides", "Shakes"];
export const inr = (n) => "₹" + n.toLocaleString("en-IN");

export const HOURS = [
  ["Mon to Thu", "12pm to 11pm"],
  ["Fri and Sat", "12pm to 2am"],
  ["Sunday", "1pm to 10pm"],
];
export const ADDRESS = "14 Linking Road, Bandra West";
export const PHONE = "+91 22 1234 5678";

export const STATUSES = [
  ["received", "Order received"],
  ["preparing", "Being prepared"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];
export const statusLabel = (s) => STATUSES.find(([k]) => k === s)?.[1] ?? s;
