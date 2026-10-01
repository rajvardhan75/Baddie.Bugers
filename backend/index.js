import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createHash, timingSafeEqual } from "node:crypto";

const { MONGODB_URI, PORT = 5000, CLIENT_ORIGIN = "http://localhost:5173", ADMIN_USERNAME, ADMIN_PASSWORD, STAFF_USERNAME, STAFF_PASSWORD, JWT_SECRET } = process.env;
if (!MONGODB_URI) { console.error("Set MONGODB_URI in .env"); process.exit(1); }
if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("Set ADMIN_USERNAME, ADMIN_PASSWORD and a JWT_SECRET (16+ chars) in .env");
  process.exit(1);
}
const CATS = ["Burgers", "Sides", "Shakes"];
const STATUSES = ["received", "preparing", "out_for_delivery", "delivered", "cancelled"];

const MenuItem = mongoose.model("MenuItem", new mongoose.Schema({
  _id: String, cat: String, name: String, desc: String, price: Number, img: String, alt: String,
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  name: String, phone: String, address: String,
  items: [{ _id: false, id: String, name: String, price: Number, qty: Number }],
  total: Number,
  status: { type: String, default: "received" },
}, { timestamps: true }));

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "20kb" }));

app.get("/api/menu", async (_req, res) => {
  const items = await MenuItem.find().lean();
  res.json(items.map(({ _id, __v, ...rest }) => ({ id: _id, ...rest })));
});

// ---- Staff and admin (accounts live in .env; customers never log in) ----
const digest = (s) => createHash("sha256").update(String(s)).digest();
const same = (a, b) => timingSafeEqual(digest(a), digest(b)); // constant time, equal length

// ponytail: in-memory limiter (per IP, resets on restart); use a shared store if you run several servers.
const attempts = new Map();
function loginLimiter(req, res, next) {
  const now = Date.now();
  const a = attempts.get(req.ip);
  if (!a || a.reset < now) attempts.set(req.ip, { n: 1, reset: now + 15 * 60_000 });
  else if (++a.n > 5) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
  next();
}

app.post("/api/staff/login", loginLimiter, (req, res) => {
  const { username, password } = req.body ?? {};
  // check every account without short-circuiting so timing does not reveal what was wrong
  const isAdmin = same(username, ADMIN_USERNAME) & same(password, ADMIN_PASSWORD);
  const isStaff = STAFF_USERNAME && STAFF_PASSWORD ? same(username, STAFF_USERNAME) & same(password, STAFF_PASSWORD) : 0;
  const role = isAdmin ? "admin" : isStaff ? "staff" : null;
  if (!role) return res.status(401).json({ error: "Wrong username or password." });
  attempts.delete(req.ip);
  res.json({ role, token: jwt.sign({ role }, JWT_SECRET, { expiresIn: "12h" }) });
});

// Roles: "admin" (menu + orders) and "staff" (orders only).
const requireRole = (...roles) => (req, res, next) => {
  try {
    const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    if (!roles.includes(jwt.verify(token, JWT_SECRET).role)) throw new Error("role");
    next();
  } catch {
    res.status(401).json({ error: "Please log in again." });
  }
};

app.post("/api/staff/dishes", requireRole("admin"), async (req, res) => {
  const { name, cat, desc, price, img } = req.body ?? {};
  const errors = {};
  if (String(name ?? "").trim().length < 2 || String(name).length > 60) errors.name = "Name must be 2 to 60 characters.";
  if (!CATS.includes(cat)) errors.cat = "Pick a category.";
  if (String(desc ?? "").trim().length < 5 || String(desc).length > 200) errors.desc = "Description must be 5 to 200 characters.";
  if (!Number.isInteger(price) || price < 1 || price > 100000) errors.price = "Price must be a whole number of rupees.";
  if (img && !/^(https?:\/\/\S+|\/img\/\S+)$/.test(img)) errors.img = "Image must be an https link or a /img/ path.";
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  let id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dish";
  if (await MenuItem.exists({ _id: id })) id += "-" + Date.now().toString(36);
  const dish = { _id: id, cat, name: name.trim(), desc: desc.trim(), price, ...(img ? { img, alt: name.trim() } : {}) };
  await MenuItem.create(dish);
  const { _id, ...rest } = dish;
  res.status(201).json({ id: _id, ...rest });
});

app.delete("/api/staff/dishes/:id", requireRole("admin"), async (req, res) => {
  const r = await MenuItem.deleteOne({ _id: req.params.id });
  res.status(r.deletedCount ? 200 : 404).json({ ok: !!r.deletedCount });
});

// Trust boundary: validate input, and price from the DB, never from the client.
app.post("/api/orders", async (req, res) => {
  const { name, phone, address, items } = req.body ?? {};
  const digits = String(phone ?? "").replace(/\D/g, "");
  const errors = {};
  if (String(name ?? "").trim().length < 2) errors.name = "Enter your name.";
  if (!/^\d{10}$/.test(digits)) errors.phone = "Enter a 10-digit phone number.";
  if (String(address ?? "").trim().length < 8) errors.address = "Enter a full delivery address.";
  const valid = Array.isArray(items) && items.length > 0 && items.length <= 30 &&
    items.every((i) => typeof i?.id === "string" && Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 20);
  if (!valid) errors.items = "Your order is empty or invalid.";
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const dishes = await MenuItem.find({ _id: { $in: items.map((i) => i.id) } }).lean();
  const byId = new Map(dishes.map((d) => [d._id, d]));
  if (items.some((i) => !byId.has(i.id))) return res.status(400).json({ errors: { items: "An item is no longer on the menu." } });

  const lines = items.map((i) => ({ id: i.id, name: byId.get(i.id).name, price: byId.get(i.id).price, qty: i.qty }));
  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const order = await Order.create({ name: name.trim(), phone: digits, address: address.trim(), items: lines, total });
  res.status(201).json({ id: order._id, total });
});

const staff = requireRole("admin", "staff");

app.get("/api/staff/orders", staff, async (_req, res) => {
  res.json(await Order.find().sort({ createdAt: -1 }).limit(100).lean());
});

app.patch("/api/staff/orders/:id", staff, async (req, res) => {
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Unknown status." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Order not found." });
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
  order ? res.json(order) : res.status(404).json({ error: "Order not found." });
});

// Customer tracking: the unguessable order id is the key; no name, phone or address is returned.
app.get("/api/orders/:id", async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) && await Order.findById(req.params.id).select("status items total createdAt -_id").lean();
  order ? res.json(order) : res.status(404).json({ error: "Order not found." });
});

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "Something went wrong." }); });

await mongoose.connect(MONGODB_URI);
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
