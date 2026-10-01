// Loads the menu from menu.js into MongoDB. Safe to re-run (upserts by id).
import mongoose from "mongoose";
import { MENU } from "./menu.js";

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.collection("menuitems");
await col.bulkWrite(MENU.map(({ id, ...rest }) => ({ updateOne: { filter: { _id: id }, update: { $set: rest }, upsert: true } })));
console.log(`Seeded ${MENU.length} menu items`);
await mongoose.disconnect();
