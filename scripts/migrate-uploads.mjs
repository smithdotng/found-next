// Copies every file in the uploads folder to Cloudflare R2 (or any S3-compatible bucket),
// keeping the same paths: public/uploads/property-1.jpeg → key "uploads/property-1.jpeg".
// Safe to re-run: files already in the bucket (same size) are skipped.
//
//   node --env-file=.env.local scripts/migrate-uploads.mjs --dry-run      # list what would be copied
//   node --env-file=.env.local scripts/migrate-uploads.mjs                # copy
//   node --env-file=.env.local scripts/migrate-uploads.mjs --dir=/home/ec2-user/found/public/uploads
//
// Needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (and optionally S3_REGION=auto).
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true]));
const need = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !process.env[k]);
if (need.length) {
  console.error(`Missing ${need.join(", ")} in .env.local`);
  process.exit(1);
}
const dir = path.resolve(
  args.dir || process.env.UPLOAD_DIR || (existsSync(path.resolve(here, "../../public/uploads")) ? path.resolve(here, "../../public/uploads") : path.resolve(here, "../uploads")),
);
if (!existsSync(dir)) {
  console.error(`Uploads folder not found: ${dir}`);
  process.exit(1);
}
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".pdf": "application/pdf" };
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto", forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  endpoint: process.env.S3_ENDPOINT,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
});
const Bucket = process.env.S3_BUCKET;

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

// What's already in the bucket
const existing = new Map();
let token;
do {
  const r = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: "uploads/", ContinuationToken: token }));
  for (const o of r.Contents ?? []) existing.set(o.Key, o.Size);
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);

console.log(`Source: ${dir}\nBucket: ${Bucket} (${existing.size} files already there)${args["dry-run"] ? "\nDRY RUN — nothing will be uploaded" : ""}\n`);
let copied = 0, skipped = 0, failed = 0, bytes = 0;
for await (const file of walk(dir)) {
  const rel = path.relative(dir, file).split(path.sep).join("/");
  const Key = `uploads/${rel}`;
  const ext = path.extname(file).toLowerCase();
  if (!TYPES[ext]) continue; // only images/PDFs
  const { size } = await stat(file);
  if (existing.get(Key) === size && !args.force) { skipped++; continue; }
  if (args["dry-run"]) { console.log(`would copy ${Key} (${Math.round(size / 1024)} KB)`); copied++; bytes += size; continue; }
  try {
    await s3.send(new PutObjectCommand({ Bucket, Key, Body: await readFile(file), ContentType: TYPES[ext], CacheControl: "public, max-age=31536000, immutable" }));
    copied++; bytes += size;
    if (copied % 25 === 0) console.log(`…${copied} copied`);
  } catch (e) {
    failed++;
    console.error(`FAILED ${Key}: ${e.message}`);
  }
}
console.log(`\n${args["dry-run"] ? "Would copy" : "Copied"} ${copied} files (${(bytes / 1024 / 1024).toFixed(1)} MB), skipped ${skipped} already in the bucket${failed ? `, ${failed} failed` : ""}.`);
