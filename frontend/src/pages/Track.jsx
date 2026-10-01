import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { API } from "../api.js";
import { STATUSES, statusLabel, inr } from "../data.js";

const FLOW = STATUSES.filter(([k]) => k !== "cancelled");
const DONE = ["delivered", "cancelled"];

export default function Track() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | missing | offline

  // Poll every 15s until the order is finished.
  useEffect(() => {
    let timer, alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/orders/${id}`);
        if (!alive) return;
        if (res.status === 404) return setState("missing");
        const data = await res.json();
        setOrder(data); setState("ok");
        if (!DONE.includes(data.status)) timer = setTimeout(load, 15000);
      } catch {
        if (alive) { setState("offline"); timer = setTimeout(load, 15000); }
      }
    };
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [id]);

  if (state === "missing") return <div className="wrap page narrow"><h1>Order not found.</h1><p className="lead">Check the link and try again.</p><Link className="btn btn-primary" to="/menu">Back to the menu</Link></div>;
  if (!order) return <div className="wrap page narrow"><h1>Finding your order...</h1>{state === "offline" && <p className="err" role="alert">Could not reach the kitchen. Retrying.</p>}</div>;

  const idx = FLOW.findIndex(([k]) => k === order.status);
  return (
    <div className="wrap page narrow">
      <h1>{statusLabel(order.status)}.</h1>
      {order.status === "cancelled" ? (
        <p className="lead">This order was cancelled. Call us if that is a surprise.</p>
      ) : (
        <ol className="track">
          {FLOW.map(([k, label], i) => (
            <li key={k} className={i <= idx ? "done" : ""} aria-current={i === idx ? "step" : undefined}>
              {i <= idx ? <CheckCircle weight="bold" size={26} /> : <Circle weight="bold" size={26} />}
              <span>{label}</span>
            </li>
          ))}
        </ol>
      )}
      <ul className="lines">
        {order.items.map((l) => (<li key={l.id} className="admin-row"><span>{l.qty} x {l.name}</span><b>{inr(l.price * l.qty)}</b></li>))}
      </ul>
      <div className="total"><span>Total</span><b>{inr(order.total)}</b></div>
      {state === "offline" && <p className="err" role="alert" style={{ marginTop: "1rem" }}>Connection lost. Retrying.</p>}
    </div>
  );
}
