import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { HOURS, ADDRESS, PHONE } from "../data.js";

export default function Contact() {
  return (
    <div className="wrap page visit">
      <div className="photo rv"><img src="/img/fries.jpg" alt="A basket of hand-cut fries" /></div>
      <div className="visit-copy">
        <h1>Hungry? Come get it.</h1>
        <p className="lead">{ADDRESS}<br /><a className="accent" href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a></p>
        <div className="hours">{HOURS.map(([d, t]) => (<span key={d} style={{ display: "contents" }}><b>{d}</b><span>{t}</span></span>))}</div>
        <div><Link className="btn btn-primary" to="/order">Order now <ArrowUpRight weight="bold" /></Link></div>
      </div>
    </div>
  );
}
