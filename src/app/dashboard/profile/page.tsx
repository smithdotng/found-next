import { requireUser } from "@/lib/session";
import { connectDB, toPlain } from "@/lib/db";
import { User } from "@/lib/models";
import { PageHeader } from "@/components/dashboard/ui";
import { ProfileForms, type ProfileUser } from "@/components/dashboard/profile-forms";

export const metadata = { title: "Profile & settings" };

export default async function ProfilePage() {
  const session = await requireUser();
  await connectDB();
  const user = toPlain<ProfileUser>(await User.findById(session.userId).select("-password -resetPasswordToken -resetPasswordExpires").lean());
  return (
    <>
      <PageHeader title="Profile & settings" description="How you appear on Found, your notification preferences and password." />
      <ProfileForms user={user} />
    </>
  );
}
