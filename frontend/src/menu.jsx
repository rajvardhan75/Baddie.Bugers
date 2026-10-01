import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API } from "./api.js";

const Ctx = createContext(null);
export const useMenu = () => useContext(Ctx);

// Menu comes from the API so dishes the admin adds show up for everyone.
export function MenuProvider({ children }) {
  const [menu, setMenu] = useState(null); // null = loading
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/menu`);
      if (!res.ok) throw new Error();
      setMenu(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  return <Ctx.Provider value={{ menu: menu ?? [], loading: menu === null && !error, error, reload }}>{children}</Ctx.Provider>;
}
