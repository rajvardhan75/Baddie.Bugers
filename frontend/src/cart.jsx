import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMenu } from "./menu.jsx";

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const { menu } = useMenu();
  // qty by item id, persisted so a refresh keeps the order
  const [qty, setQty] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bb-cart")) || {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("bb-cart", JSON.stringify(qty)); } catch { /* storage blocked: cart stays in memory */ }
  }, [qty]);

  const value = useMemo(() => {
    const lines = menu.filter((m) => qty[m.id]).map((m) => ({ ...m, qty: qty[m.id] }));
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
      add: (id) => setQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 })),
      remove: (id) => setQty((q) => {
        const { [id]: cur, ...rest } = q;
        return cur > 1 ? { ...rest, [id]: cur - 1 } : rest;
      }),
      clear: () => setQty({}),
    };
  }, [qty, menu]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
