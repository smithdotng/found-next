import mongoose from "mongoose";

// Register every model once so populate() works regardless of import order.
import "./models/User";
import "./models/Property";
import "./models/Inquiry";
import "./models/Project";
import "./models/ProjectInquiry";
import "./models/Blog";
import "./models/FeaturedProperty";
import "./models/Promotion";
import "./models/Click";
import "./models/Transaction";
import "./models/Withdrawal";
import "./models/Favorite";
import "./models/NewsletterCampaign";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

/**
 * Connects to the same MongoDB database the Express app uses (MONGODB_URI).
 * The connection is cached across hot reloads and serverless invocations.
 */
export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** Turns lean Mongo documents (ObjectIds, Dates) into plain JSON for client components. */
export function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
