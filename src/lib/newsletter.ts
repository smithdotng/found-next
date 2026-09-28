export const AUDIENCES = [
  { value: "realtors_optin", label: "Realtors who opted in" },
  { value: "realtors", label: "All realtors" },
  { value: "agents_optin", label: "Agents who opted in" },
  { value: "agents", label: "All agents" },
  { value: "all_optin", label: "Everyone who opted in" },
  { value: "all", label: "Everyone (realtors & agents)" },
] as const;

/** Same audience rules as the Express admin newsletter sender. */
export function audienceQuery(audience: string) {
  const optIn = { $or: [{ "preferences.marketingEmails": true }, { "preferences.weeklyNewsletter": true }, { newsletter: true }] };
  const base = { isSuspended: { $ne: true } };
  switch (audience) {
    case "realtors": return { ...base, userType: "realtor" };
    case "agents": return { ...base, userType: "agent" };
    case "all": return { ...base, userType: { $in: ["realtor", "agent"] } };
    case "agents_optin": return { ...base, userType: "agent", ...optIn };
    case "all_optin": return { ...base, userType: { $in: ["realtor", "agent"] }, ...optIn };
    default: return { ...base, userType: "realtor", ...optIn };
  }
}

