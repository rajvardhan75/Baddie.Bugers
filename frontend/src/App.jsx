import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingBag, InstagramLogo, BaseballCap } from "@phosphor-icons/react";
import { useCart } from "./cart.jsx";
import { ADDRESS } from "./data.js";
import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Order from "./pages/Order.jsx";
import Staff from "./pages/Staff.jsx";
import Track from "./pages/Track.jsx";

function Header() {
  const { count } = useCart();
  return (
    <nav>
      <div className="wrap">
        <Link className="logo" to="/">baddie<span className="accent">.</span>burger</Link>
        <div className="links">
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/about">Our story</NavLink>
          <NavLink to="/visit">Visit</NavLink>
        </div>
        <div className="nav-right">
          <Link className="btn btn-primary" to="/order">
            <ShoppingBag weight="bold" size={18} /> Order now{count > 0 && <span className="badge">{count}</span>}
          </Link>
          <Link className="staff-link" to="/staff" aria-label="Staff login" title="Staff login"><BaseballCap weight="bold" size={22} /></Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <span>Baddie Burger, {ADDRESS}</span>
        <a href="https://instagram.com" aria-label="Instagram"><InstagramLogo weight="bold" /> Instagram</a>
      </div>
    </footer>
  );
}

export default function App() {
  const { pathname } = useLocation();

  // New page: scroll to top, then reveal .rv elements on enter (IntersectionObserver, no scroll listeners).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = pathname === "/" ? "Baddie Burger" : `${pathname.slice(1).replace(/^./, (c) => c.toUpperCase())} | Baddie Burger`;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/visit" element={<Contact />} />
          <Route path="/order" element={<Order />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="*" element={<div className="wrap page"><h1>Page not found</h1><p className="lead">That one is off the menu.</p><Link className="btn btn-primary" to="/">Back home</Link></div>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
