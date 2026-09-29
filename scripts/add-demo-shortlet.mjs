// Adds a DEMO shortlet (and a demo host who owns it) so you can simulate Found Apartments bookings.
//
//   node --env-file=.env.local scripts/add-demo-shortlet.mjs                 # add / refresh the demo
//   node --env-file=.env.local scripts/add-demo-shortlet.mjs --email=you@example.com
//        (demo host uses your inbox, so you receive the host booking emails)
//   node --env-file=.env.local scripts/add-demo-shortlet.mjs --remove        # delete everything it created
//
// Details are modelled on typical 2-bedroom Wuse 2 shortlets (₦100k–₦230k/night). The text and images
// are original and clearly marked DEMO — it is not a real apartment.
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import User from "../src/lib/models/User.js";
import Property from "../src/lib/models/Property.js";
import Booking from "../src/lib/models/Booking.js";
import BlockedDate from "../src/lib/models/BlockedDate.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const SLUG = "demo-luxury-2-bedroom-apartment-wuse-2";
const HOST_EMAIL = String(args.email || "demo-host@found.ng").toLowerCase();

function uploadRoot() {
  if (process.env.UPLOAD_DIR) return path.resolve(process.env.UPLOAD_DIR);
  const shared = path.resolve(here, "..", "..", "public", "uploads");
  return existsSync(shared) ? shared : path.resolve(here, "..", "uploads");
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/add-demo-shortlet.mjs");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
const demoDir = path.join(uploadRoot(), "demo");

if (args.remove) {
  const props = await Property.find({ slug: SLUG }).select("_id owner");
  const ids = props.map((p) => p._id);
  const [b, x, p] = await Promise.all([Booking.deleteMany({ property: { $in: ids } }), BlockedDate.deleteMany({ property: { $in: ids } }), Property.deleteMany({ _id: { $in: ids } })]);
  const hosts = await User.deleteMany({ "hostProfile.businessName": "Found Demo Stays", userType: "host" });
  rmSync(demoDir, { recursive: true, force: true });
  console.log(`Removed: ${p.deletedCount} listing, ${b.deletedCount} bookings, ${x.deletedCount} blocks, ${hosts.deletedCount} demo host.`);
  await mongoose.disconnect();
  process.exit(0);
}

// 1. Demo host — approved and with the agreement signed, so the listing can be booked.
let host = await User.findOne({ email: HOST_EMAIL });
let password = null;
if (host && host.userType !== "host") {
  console.error(`${HOST_EMAIL} already belongs to a ${host.userType} account. Use --email=another-address.`);
  process.exit(1);
}
if (!host) {
  password = randomBytes(6).toString("base64url");
  host = new User({ name: "Demo Host", email: HOST_EMAIL, phone: "08000000000", password, userType: "host" });
}
host.hostProfile = {
  ...(host.hostProfile?.toObject?.() ?? {}),
  businessName: "Found Demo Stays",
  city: "Wuse 2",
  state: "Abuja",
  units: 1,
  experience: "1-3",
  about: "Demo host account used to test Found Apartments bookings. Not a real host.",
  status: "approved",
  reviewNote: "Demo account",
  reviewedAt: new Date(),
  commissionRate: 25,
  agreement: { status: "accepted", version: "2026-09", commissionRate: 25, acceptedAt: new Date(), signedName: "Demo Host", signedIp: "demo" },
};
await host.save();

// 2. Images
mkdirSync(demoDir, { recursive: true });
const images = [1, 2, 3, 4, 5].map((n, i) => {
  copyFileSync(path.join(here, "demo-shortlet", `demo-${n}.jpg`), path.join(demoDir, `demo-shortlet-${n}.jpg`));
  return { url: `/uploads/demo/demo-shortlet-${n}.jpg`, isPrimary: i === 0 };
});

// 3. The listing (upserted so re-running refreshes it)
const data = {
  title: "[DEMO] Luxury 2-bedroom apartment off Ademola Adetokunbo, Wuse 2",
  slug: SLUG,
  description: [
    "DEMO LISTING — this is not a real apartment. It exists so the Found team can test booking requests on Found Apartments. Please don't book it for a real stay.",
    "",
    "A bright, fully serviced 2-bedroom apartment in the heart of Wuse 2, a short drive from Ademola Adetokunbo Crescent's restaurants, banks and shopping. Both bedrooms have king-size beds, air conditioning and en-suite bathrooms. The open-plan lounge has a smart TV with Netflix and DStv, and the kitchen is fully fitted with a washing machine.",
    "",
    "24/7 power, fast Wi-Fi, round-the-clock security, dedicated parking and access to a shared rooftop pool. Ideal for business trips and family visits.",
  ].join("\n"),
  propertyType: "shortlet",
  transactionType: "rent",
  price: 160000,
  priceNegotiable: false,
  location: { address: "Off Ademola Adetokunbo Crescent", city: "Wuse 2", state: "Abuja", lga: "Abuja Municipal", landmark: "Ademola Adetokunbo Crescent" },
  features: { bedrooms: 2, bathrooms: 2, toilets: 3, parkingSpaces: 1, furnished: true, serviced: true, security: true, powerSupply: true, borehole: true },
  images,
  owner: host._id,
  ownerType: "host",
  status: "available",
  agencyFee: 16000,
  listingTier: "free",
  shortletDetails: {
    isAvailable: true,
    minimumStay: 1,
    maximumStay: 30,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["wifi", "tv", "air conditioning", "kitchen", "washer", "pool", "parking", "security", "workspace"],
    houseRules: ["no smoking", "no parties"],
    cancellationPolicy: "moderate",
    cleaningFee: 15000,
    securityDeposit: 50000,
    weekendRate: 175000,
    weeklyDiscount: 10,
    monthlyDiscount: 20,
  },
};
const existing = await Property.findOne({ slug: SLUG });
const listing = existing ? Object.assign(existing, data) : new Property(data);
await listing.save();

const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
console.log(`\n${existing ? "Updated" : "Added"} demo shortlet: ${base}/apartments/${SLUG}`);
console.log(`Demo host login: ${HOST_EMAIL}${password ? `  /  password: ${password}` : "  (existing account — password unchanged)"}`);
console.log(`Remove it any time with: node --env-file=.env.local scripts/add-demo-shortlet.mjs --remove\n`);
await mongoose.disconnect();
