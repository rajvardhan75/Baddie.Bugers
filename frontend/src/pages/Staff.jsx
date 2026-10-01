import { useCallback, useEffect, useState } from "react";
import { Trash, SignOut } from "@phosphor-icons/react";
import { API } from "../api.js";
import { CATS, STATUSES, statusLabel, inr } from "../data.js";
import { useMenu } from "../menu.jsx";

const KEY = "bb-staff";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const write = (v) => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* storage blocked: login lasts until refresh */ } };

// Staff and admin page. The API enforces the login and role; this is only the UI.
export default function Staff() {
  const [session, setSession] = useState(read); // { token, role } | null
  const logout = () => { write(null); setSession(null); };
  const login = (s) => { write(s); setSession(s); };
  return (
    <div className="wrap page narrow-wide">
      {session ? <Dashboard session={session} logout={logout} /> : <Login onLogin={login} />}
    </div>
  );
}

function Login({ onLogin }) {
  const [f, setF] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API}/api/staff/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Login failed.");
      onLogin({ token: data.token, role: data.role });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="login">
      <h1>Staff login</h1>
      <div className="field" style={{ marginTop: "2rem" }}>
        <label htmlFor="u">Username</label>
        <input id="u" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
      </div>
      <div className="field">
        <label htmlFor="p">Password</label>
        <input id="p" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

function Dashboard({ session, logout }) {
  const [tab, setTab] = useState("orders");
  return (
    <>
      <div className="split-cta">
        <h1>{session.role === "admin" ? "Admin" : "Kitchen"}</h1>
        <button className="btn btn-ghost" onClick={logout}><SignOut weight="bold" /> Log out</button>
      </div>
      {session.role === "admin" && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>Orders</button>
          <button role="tab" aria-selected={tab === "menu"} className={tab === "menu" ? "on" : ""} onClick={() => setTab("menu")}>Menu</button>
        </div>
      )}
      {tab === "orders" ? <Orders token={session.token} logout={logout} /> : <MenuManager token={session.token} logout={logout} />}
    </>
  );
}

// Every call goes through here: an expired or bad token logs out.
const authed = (token, logout) => async (path, opts) => {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
  if (res.status === 401) { logout(); throw new Error("expired"); }
  return res;
};

function Orders({ token, logout }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);
  const call = useCallback(authed(token, logout), [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh every 20s so new orders show up without reloading.
  useEffect(() => {
    let timer, alive = true;
    const load = async () => {
      try {
        const res = await call("/api/staff/orders");
        if (alive) { setOrders(await res.json()); setError(""); }
      } catch (e) {
        if (alive && e.message !== "expired") setError("Could not load orders. Retrying.");
      }
      if (alive) timer = setTimeout(load, 20000);
    };
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [call]);

  const setStatus = async (o, status) => {
    const prev = orders;
    setOrders(orders.map((x) => (x._id === o._id ? { ...x, status } : x))); // optimistic
    try {
      const res = await call(`/api/staff/orders/${o._id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
    } catch (e) {
      if (e.message !== "expired") { setOrders(prev); setError("Could not update that order. Try again."); }
    }
  };

  if (!orders) return <p className="lead">{error || "Loading orders..."}</p>;
  const finished = (o) => o.status === "delivered" || o.status === "cancelled";
  const list = orders.filter((o) => (showDone ? finished(o) : !finished(o)));

  return (
    <>
      <div className="tabs">
        <button className={!showDone ? "on" : ""} onClick={() => setShowDone(false)}>Active ({orders.filter((o) => !finished(o)).length})</button>
        <button className={showDone ? "on" : ""} onClick={() => setShowDone(true)}>Completed</button>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {list.length === 0 && <p className="lead">{showDone ? "No completed orders yet." : "No active orders. New ones appear here by themselves."}</p>}
      <div className="orders">
        {list.map((o) => (
          <article className="order-card" key={o._id}>
            <header>
              <div><b>{o.name}</b><span>{new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></div>
              <b>{inr(o.total)}</b>
            </header>
            <ul>{o.items.map((l) => <li key={l.id}>{l.qty} x {l.name}</li>)}</ul>
            <p className="addr">{o.address}<br /><a className="accent" href={`tel:${o.phone}`}>{o.phone}</a></p>
            <div className="field">
              <label htmlFor={`s-${o._id}`}>Progress</label>
              <select id={`s-${o._id}`} value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                {STATUSES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MenuManager({ token, logout }) {
  const { menu, reload } = useMenu();
  const empty = { name: "", cat: CATS[0], desc: "", price: "", img: "" };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState("");
  const call = authed(token, logout);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setAdded("");
    try {
      const res = await call("/api/staff/dishes", { method: "POST", body: JSON.stringify({ ...f, price: Number(f.price), img: f.img.trim() || undefined }) });
      const data = await res.json();
      if (!res.ok) return setErrors(data.errors || { form: data.error });
      setAdded(`${data.name} added.`);
      setF(empty);
      reload();
    } catch (err) {
      if (err.message !== "expired") setErrors({ form: "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove ${d.name} from the menu?`)) return;
    try { await call(`/api/staff/dishes/${d.id}`, { method: "DELETE" }); reload(); } catch { /* logged out or offline: list stays as is */ }
  };

  const field = (k, label, props = {}, hint) => (
    <div className="field">
      <label htmlFor={`a-${k}`}>{label}</label>
      <input id={`a-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      <small className={errors[k] ? "err" : ""}>{errors[k] || hint}</small>
    </div>
  );

  return (
    <>
      <form onSubmit={add} noValidate className="admin-form">
        <h2>Add a dish</h2>
        {field("name", "Name")}
        <div className="field">
          <label htmlFor="a-cat">Category</label>
          <select id="a-cat" value={f.cat} onChange={set("cat")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <small className={errors.cat ? "err" : ""}>{errors.cat}</small>
        </div>
        {field("desc", "Description")}
        {field("price", "Price (₹)", { type: "number", min: 1, step: 1, inputMode: "numeric" })}
        {field("img", "Image link (optional)", { type: "text", placeholder: "https://..." }, "Paste a photo link, or leave empty for a text-only card.")}
        {errors.form && <p className="err" role="alert">{errors.form}</p>}
        {added && <p className="ok" role="status">{added}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Adding..." : "Add dish"}</button>
      </form>

      <h2 style={{ fontSize: "1.8rem", margin: "3rem 0 1rem" }}>On the menu now</h2>
      <ul className="lines">
        {menu.map((d) => (
          <li key={d.id} className="admin-row">
            <div><b>{d.name}</b><span>{d.cat}</span></div>
            <b>{inr(d.price)}</b>
            <button className="icon-btn" aria-label={`Remove ${d.name}`} onClick={() => remove(d)}><Trash weight="bold" /></button>
          </li>
        ))}
      </ul>
    </>
  );
}
