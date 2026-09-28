import { getPropertiesByIds } from "@/lib/queries";

/** Card data for the device-side "Saved" list: GET /api/properties?ids=a,b,c */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const items = await getPropertiesByIds(ids);
  return Response.json({ items }, { headers: { "Cache-Control": "private, max-age=60" } });
}
