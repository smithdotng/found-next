import { connectDB } from "@/lib/db";
import { FractionalOffering } from "@/lib/models";
import { getSession } from "@/lib/session";
import { readDocument } from "@/lib/private-docs";
import { PUBLIC_STATUSES } from "@/lib/fractional";

/**
 * Offering documents (information memorandum, title, valuation, SPV papers). Any signed-in
 * user can read the documents of a public offering; drafts only by their developer and admins.
 */
export async function GET(_req: Request, ctx: RouteContext<"/fractional/[slug]/doc/[docId]">) {
  const { slug, docId } = await ctx.params;
  const session = await getSession();
  if (!session.userId) return new Response("Sign in required", { status: 401 });
  if (!/^[a-f0-9]{24}$/i.test(docId)) return new Response("Not found", { status: 404 });

  await connectDB();
  const o = await FractionalOffering.findOne({ slug }).select("developer status documents");
  if (!o) return new Response("Not found", { status: 404 });
  const privileged = session.userType === "admin" || String(o.developer) === session.userId;
  if (!PUBLIC_STATUSES.includes(o.status) && !privileged) return new Response("Not found", { status: 404 });
  const doc = o.documents.id(docId);
  if (!doc) return new Response("Not found", { status: 404 });

  const bytes = await readDocument(doc.key);
  if (!bytes) return new Response("Document unavailable", { status: 404 });
  const name = String(doc.name || "document").replace(/[^\w.\- ]+/g, "_");
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
