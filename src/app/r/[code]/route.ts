import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Click, Promotion, User } from "@/lib/models";
import { getSession } from "@/lib/session";

/** Agent referral links: /r/FND-XXXXXX-XXXXXX-XXXXXX (port of promotionController.trackClickByCode). */
export async function GET(req: Request, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params;
  const url = new URL(req.url);
  try {
    await connectDB();
    const promotion = await Promotion.findOne({ referralCode: code }).populate("property", "slug");
    if (!promotion || !promotion.property) return NextResponse.redirect(new URL("/properties", url));

    await Click.create({
      promotion: promotion._id,
      agent: promotion.agent,
      property: promotion.property._id,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
      referrer: req.headers.get("referer") ?? "",
    });
    await Promotion.updateOne({ _id: promotion._id }, { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } });
    await User.updateOne({ _id: promotion.agent }, { $inc: { "referralStats.totalClicks": 1 } });

    const session = await getSession();
    session.referringAgent = {
      id: String(promotion.agent),
      promotionId: String(promotion._id),
      propertyId: String(promotion.property._id),
      referralCode: promotion.referralCode,
    };
    await session.save();

    return NextResponse.redirect(new URL(`/properties/${promotion.property.slug}`, url));
  } catch (e) {
    console.error("Track click error:", e);
    return NextResponse.redirect(new URL("/properties", url));
  }
}
