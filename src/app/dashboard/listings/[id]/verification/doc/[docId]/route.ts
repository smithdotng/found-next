import { connectDB } from "@/lib/db";
import { PreVerification } from "@/lib/models";
import { getSession } from "@/lib/session";
import { readDocument } from "@/lib/private-docs";

/** Serves a pre-verification document to the listing's realtor or an admin only. */
export async function GET(_req: Request, ctx: RouteContext<"/dashboard/listings/[id]/verification/doc/[docId]">) {
  const { id, docId } = await ctx.params;
  const session = await getSession();
  if (!session.userId) return new Response("Sign in required", { status: 401 });
  if (!/^[a-f0-9]{24}$/i.test(id) || !/^[a-f0-9]{24}$/i.test(docId)) return new Response("Not found", { status: 404 });

  await connectDB();
  const check = await PreVerification.findOne({ property: id }).select("owner documents");
  if (!check) return new Response("Not found", { status: 404 });
  if (session.userType !== "admin" && String(check.owner) !== session.userId) return new Response("Not found", { status: 404 });
  const doc = check.documents.id(docId);
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
