import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, CheckCircle } from "@phosphor-icons/react";
import { useCart } from "../cart.jsx";
import { inr } from "../data.js";
import { API } from "../api.js";

// Validation at the trust boundary: name, 10-digit phone, address.
function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = "Enter your name.";
  if (!/^\d{10}$/.test(f.phone.replace(/\D/g, ""))) e.phone = "Enter a 10-digit phone number.";
  if (f.address.trim().length < 8) e.address = "Enter a full delivery address.";
  return e;
}

export default function Order() {
  const { lines, total, add, remove, clear } = useCart();
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, items: lines.map((l) => ({ id: l.id, qty: l.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors(data.errors || { form: data.error }); return; }
      setDone({ name: f.name.trim(), total: data.total, id: data.id }); // server-computed total
      clear();
    } catch {
      setErrors({ form: "Could not reach the kitchen. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="wrap page narrow">
        <CheckCircle size={56} weight="bold" className="accent" />
        <h1>Order placed, {done.name}.</h1>
        <p className="lead">{inr(done.total)} to pay on delivery. Expect it in about 30 minutes.</p>
        <div className="cta-row"><Link className="btn btn-primary" to={`/track/${done.id}`}>Track your order</Link><Link className="btn btn-ghost" to="/menu">Order more</Link></div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="wrap page narrow">
        <h1>Your order is empty.</h1>
        <p className="lead">Pick a burger and it will show up here.</p>
        <Link className="btn btn-primary" to="/menu">Browse the menu</Link>
      </div>
    );
  }

  const field = (k, label, type = "text", hint) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={`${k}-m`} autoComplete={k === "phone" ? "tel" : k === "name" ? "name" : "street-address"} />
      <small id={`${k}-m`} className={errors[k] ? "err" : ""}>{errors[k] || hint}</small>
    </div>
  );

  return (
    <div className="wrap page order">
      <div>
        <h1>Your order</h1>
        <ul className="lines">
          {lines.map((l) => (
            <li key={l.id}>
              <div><b>{l.name}</b><span>{inr(l.price)} each</span></div>
              <div className="stepper">
                <button aria-label={`Remove one ${l.name}`} onClick={() => remove(l.id)}><Minus weight="bold" /></button>
                <span>{l.qty}</span>
                <button aria-label={`Add one ${l.name}`} onClick={() => add(l.id)}><Plus weight="bold" /></button>
              </div>
              <b className="line-total">{inr(l.price * l.qty)}</b>
            </li>
          ))}
        </ul>
        <div className="total"><span>Total</span><b>{inr(total)}</b></div>
      </div>

      <form onSubmit={submit} noValidate>
        <h2>Delivery details</h2>
        {field("name", "Name")}
        {field("phone", "Phone", "tel", "We call only if there is a problem.")}
        {field("address", "Address")}
        {(errors.form || errors.items) && <p className="err" role="alert">{errors.form || errors.items}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Placing order..." : "Place order"}</button>
      </form>
    </div>
  );
}
