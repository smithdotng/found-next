// Times the MongoDB connection and a few typical queries.
// Run from the found-next folder:  node --env-file=.env.local scripts/db-check.mjs
import dns from "node:dns/promises";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI is not set in .env.local"); process.exit(1); }
const host = uri.replace(/^.*@/, "").split(/[/?]/)[0];
const ms = (t) => `${Date.now() - t} ms`;

if (uri.startsWith("mongodb+srv://")) {
  let t = Date.now();
  try { const srv = await dns.resolveSrv(`_mongodb._tcp.${host}`); console.log(`DNS SRV lookup: ${ms(t)} (${srv.length} servers)`); }
  catch (e) { console.log(`DNS SRV lookup FAILED after ${ms(t)}: ${e.code || e.message}`); }
}

let t = Date.now();
await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
console.log(`Connect (DNS + TLS + login): ${ms(t)}`);
const db = mongoose.connection.db;
for (let i = 1; i <= 3; i++) { t = Date.now(); await db.admin().ping(); console.log(`Ping ${i} (one round trip): ${ms(t)}`); }

t = Date.now();
await Promise.all([
  db.collection("properties").find({ status: "available" }).sort({ createdAt: -1 }).limit(8).toArray(),
  db.collection("properties").countDocuments({ status: "available" }),
  db.collection("blogs").find({ status: "published" }).limit(3).toArray(),
  db.collection("featuredproperties").find({ isActive: true }).limit(4).toArray(),
]);
console.log(`Home page queries (in parallel): ${ms(t)}`);
const hello = await db.admin().command({ hello: 1 });
console.log(`Cluster primary: ${hello.primary || hello.me || "?"}`);
await mongoose.disconnect();
