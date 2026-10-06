import "server-only";
import { Property } from "./models";

/** Gives (or removes) the realtor-level badge on all of a realtor's listings. Per-property verifications are kept. */
export async function applyRealtorBadge(userId: string, until: Date | null) {
  if (until) {
    await Property.updateMany(
      { owner: userId, "verification.via": { $ne: "property" } },
      { $set: { verification: { verified: true, via: "realtor", verifiedAt: new Date(), until } } },
    );
  } else {
    await Property.updateMany({ owner: userId, "verification.via": "realtor" }, { $unset: { verification: "" } });
  }
}
