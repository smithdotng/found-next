import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession, type SessionOptions } from "iron-session";
import type { UserType } from "./types";

export interface SessionData {
  userId?: string;
  userType?: UserType;
  userName?: string;
  userEmail?: string;
  /** Set when a visitor arrives through an agent's /r/:code link, used to credit inquiries. */
  referringAgent?: { id: string; promotionId: string; propertyId: string; referralCode: string };
}

// iron-session needs a 32+ char password; derive one from SESSION_SECRET so the
// existing .env value works unchanged.
function sessionPassword() {
  const secret = process.env.SESSION_SECRET || "found-dev-secret-change-me";
  return createHash("sha256").update(secret).digest("hex");
}

export const DAY = 60 * 60 * 24;

export const sessionOptions = (ttl = DAY * 30): SessionOptions => ({
  password: sessionPassword(),
  cookieName: "found_session",
  ttl,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
  },
});

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export function superAdminEmail() {
  return (process.env.SUPERADMIN_EMAIL || "admin@found.ng").toLowerCase();
}

export function isSuperAdmin(s: Pick<SessionData, "userType" | "userEmail">) {
  return s.userType === "admin" && !!s.userEmail && s.userEmail.toLowerCase() === superAdminEmail();
}

export type AuthedSession = SessionData & Required<Pick<SessionData, "userId" | "userType" | "userName" | "userEmail">>;

/** Server-side guard for dashboard pages and server actions. */
export async function requireUser(roles?: UserType[]): Promise<AuthedSession> {
  const session = await getSession();
  if (!session.userId || !session.userType) redirect("/login?next=/dashboard");
  if (roles && !roles.includes(session.userType)) redirect("/dashboard?notice=Access+denied");
  return session as unknown as AuthedSession;
}
