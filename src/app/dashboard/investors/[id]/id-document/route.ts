import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { getSession } from "@/lib/session";
import { readDocument } from "@/lib/private-docs";

/** An investor's ID document, for the investor themself and Found admins only. */
export async function GET(_req: Request, ctx: RouteContext<"/dashboard/investors/[id]/id-document">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session.userId) return new Response("Sign in required", { status: 401 });
  if (!/^[a-f0-9]{24}$/i.test(id) || (session.userType !== "admin" && session.userId !== id)) return new Response("Not found", { status: 404 });
  await connectDB();
  const u = await User.findById(id).select("investorProfile.idDocument").lean<{ investorProfile?: { idDocument?: { key?: string; name?: string; contentType?: string } } }>();
  const doc = u?.investorProfile?.idDocument;
  if (!doc?.key) return new Response("Not found", { status: 404 });
  const bytes = await readDocument(doc.key);
  if (!bytes) return new Response("Document unavailable", { status: 404 });
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": doc.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${String(doc.name || "id").replace(/[^\w.\- ]+/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
