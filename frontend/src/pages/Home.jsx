import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { inr } from "../data.js";
import { useMenu } from "../menu.jsx";

const REVIEWS = [
  ["The crust on that patty is unreal. I came back the next day.", "Ananya Mehra, food blogger"],
  ["Best fries in the city and I will fight anyone about it.", "Kabir Sandhu, regular"],
  ["That pink sauce should be sold by the bottle.", "Riya Fernandes, student"],
  ["Fast, loud, and actually worth the queue.", "Tarun Bhatia, delivery rider"],
];

function Cell({ item, cls }) {
  const img = !!item.img;
  return (
    <article className={`cell ${img ? "img" : ""} ${cls} rv`}>
      {img && <img src={item.img} alt={item.alt} loading="lazy" />}
      <h3>{item.name}</h3>
      <p>{item.desc}</p>
      <div className="price">{inr(item.price)}</div>
    </article>
  );
}

export default function Home() {
  const { menu } = useMenu();
  const by = (id) => menu.find((m) => m.id === id);
  const feature = [["double", "c1"], ["chick", "c2"], ["sauce", "c3"], ["fries", "c4"], ["caramel", "c5"]];
  return (
    <>
      <div className="wrap hero">
        <div>
          <h1>Smashed hard. <span className="accent">Stacked</span> proper.</h1>
          <p>Fresh beef, crisp edges, sauce that talks back. Ready in ten minutes.</p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/order">Order now <ArrowUpRight weight="bold" /></Link>
            <Link className="btn btn-ghost" to="/menu">See the menu</Link>
          </div>
        </div>
        <div className="hero-img"><img src="/img/hero.jpg" alt="A burger with lettuce on a black background" fetchpriority="high" /></div>
      </div>

      <section>
        <div className="wrap">
          <h2 className="sec-head rv">The short menu. Every item earns its spot.</h2>
          <div className="bento">
            {feature.map(([id, cls]) => by(id) && <Cell key={id} item={by(id)} cls={cls} />)}
          </div>
          <div style={{ marginTop: "2rem" }}><Link className="btn btn-ghost" to="/menu">Full menu <ArrowUpRight weight="bold" /></Link></div>
        </div>
      </section>

      <section className="process">
        <div className="wrap split-cta">
          <h2 className="rv">No shortcuts behind the counter.</h2>
          <Link className="btn btn-primary" to="/about">Our story <ArrowUpRight weight="bold" /></Link>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2 className="sec-head rv">People talk. We just listen.</h2>
          <div className="quotes">
            {REVIEWS.map(([q, who]) => (
              <blockquote className="rv" key={who}><p>“{q}”</p><footer>{who}</footer></blockquote>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
