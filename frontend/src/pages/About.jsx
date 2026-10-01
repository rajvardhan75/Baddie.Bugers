import { Link } from "react-router-dom";
import { Fire, Hammer, HandGrabbing, ArrowUpRight } from "@phosphor-icons/react";

const STEPS = [
  [Fire, "Ground daily", "Chuck and brisket are ground each morning. Nothing frozen, nothing pre-formed."],
  [Hammer, "Smashed to order", "Each ball hits a ripping hot flat-top and gets pressed flat for a lacy, crunchy crust."],
  [HandGrabbing, "Stacked by hand", "Cheese melts under the lid, the bun gets toasted in beef fat, then it goes straight to you."],
];

export default function About() {
  return (
    <>
      <div className="wrap page">
        <h1>No shortcuts behind the counter.</h1>
        <p className="lead">Baddie Burger started with one flat-top and one rule: if it is not made fresh, it does not go in the bun.</p>
      </div>
      <section className="process" style={{ paddingTop: "3rem" }}>
        <div className="wrap steps">
          {STEPS.map(([Icon, h, p]) => (
            <div className="step rv" key={h}><Icon weight="bold" size={30} className="accent" /><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>
      <section>
        <div className="wrap split-cta">
          <h2 className="rv">Hungry yet?</h2>
          <Link className="btn btn-primary" to="/order">Order now <ArrowUpRight weight="bold" /></Link>
        </div>
      </section>
    </>
  );
}
