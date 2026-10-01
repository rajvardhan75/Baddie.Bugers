import { useState } from "react";
import { Plus, Minus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { CATS, inr } from "../data.js";
import { useMenu } from "../menu.jsx";
import { useCart } from "../cart.jsx";

export default function Menu() {
  const { menu, loading, error } = useMenu();
  const [cat, setCat] = useState(CATS[0]);
  const { add, remove, lines, count, total } = useCart();
  const qtyOf = (id) => lines.find((l) => l.id === id)?.qty || 0;

  return (
    <div className="wrap page">
      <h1>The menu</h1>
      <div className="tabs" role="tablist">
        {CATS.map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {loading && <p className="lead">Loading the menu...</p>}
      {error && <p className="lead err" role="alert">Could not load the menu. Refresh to try again.</p>}
      <div className="grid-menu">
        {menu.filter((m) => m.cat === cat).map((m) => (
          <article className="dish" key={m.id}>
            {m.img && <div className="dish-img"><img src={m.img} alt={m.alt} loading="lazy" /></div>}
            <div className="dish-body">
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
              <div className="dish-foot">
                <span className="price">{inr(m.price)}</span>
                {qtyOf(m.id) === 0 ? (
                  <button className="btn btn-primary sm" onClick={() => add(m.id)}><Plus weight="bold" /> Add</button>
                ) : (
                  <div className="stepper">
                    <button aria-label={`Remove one ${m.name}`} onClick={() => remove(m.id)}><Minus weight="bold" /></button>
                    <span aria-live="polite">{qtyOf(m.id)}</span>
                    <button aria-label={`Add one ${m.name}`} onClick={() => add(m.id)}><Plus weight="bold" /></button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {count > 0 && (
        <Link to="/order" className="cartbar">
          <span>{count} {count === 1 ? "item" : "items"}</span><b>View order {inr(total)}</b>
        </Link>
      )}
    </div>
  );
}
