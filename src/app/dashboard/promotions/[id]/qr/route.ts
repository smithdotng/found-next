import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import { Promotion } from "@/lib/models";
import { getSession } from "@/lib/session";

/** PNG QR code for an agent's referral link (?download=1 to save it). */
export async function GET(req: Request, ctx: RouteContext<"/dashboard/promotions/[id]/qr">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session.userId) return new Response("Unauthorized", { status: 401 });
  await connectDB();
  const promo = await Promotion.findById(id).select("agent referralLink referralCode").lean<{ agent: unknown; referralLink: string; referralCode: string }>();
  if (!promo || (String(promo.agent) !== session.userId && session.userType !== "admin")) return new Response("Not found", { status: 404 });
  const png = await QRCode.toBuffer(promo.referralLink, { width: 600, margin: 2, color: { dark: "#1b5e85", light: "#ffffff" } });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=86400",
      ...(download ? { "Content-Disposition": `attachment; filename="found-${promo.referralCode}.png"` } : {}),
    },
  });
}
