"use client";

import { useActionState, useState } from "react";
import { BadgeCheck, Camera } from "lucide-react";
import { changePassword, updateProfile } from "@/app/actions/profile";
import { FormMessage, PasswordField, SubmitButton, TextField } from "@/components/ui/form-bits";

export type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: "realtor" | "agent" | "admin";
  profileImage?: string;
  realtorProfile?: { company?: string; rcNumber?: string; address?: string; verified?: boolean };
  agentProfile?: { socialHandle?: string; uniqueLink?: string };
  preferences?: { emailInquiries?: boolean; emailTransactions?: boolean; weeklyNewsletter?: boolean; marketingEmails?: boolean };
};

export function ProfileForms({ user }: { user: ProfileUser }) {
  const [pState, pAction] = useActionState(updateProfile, null);
  const [cState, cAction] = useActionState(changePassword, null);
  const [preview, setPreview] = useState<string | null>(null);
  const avatar = preview ?? (user.profileImage && user.profileImage !== "default-avatar.jpg" ? user.profileImage : "/assets/images/default-avatar.jpg");
  const prefs = user.preferences ?? {};
  const e = (k: string) => pState?.errors?.[k];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <form action={pAction} className="card space-y-6 p-5 sm:p-6">
        <FormMessage state={pState} />
        <div className="flex items-center gap-4">
          <label className="group relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white opacity-0 transition group-hover:opacity-100"><Camera className="size-5" /></span>
            <input type="file" name="profileImage" accept="image/*" className="sr-only" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
          </label>
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              {user.name} {user.realtorProfile?.verified ? <BadgeCheck className="size-4 text-emerald-600" aria-label="Verified" /> : null}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs capitalize text-slate-400">{user.userType} account · click the photo to change it</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" name="name" defaultValue={user.name} error={e("name")} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={user.phone} error={e("phone")} />
          {user.userType === "realtor" ? (
            <>
              <TextField label="Company" name="company" defaultValue={user.realtorProfile?.company} />
              <TextField label="RC number" name="rcNumber" defaultValue={user.realtorProfile?.rcNumber} />
              <TextField label="Office address" name="address" defaultValue={user.realtorProfile?.address} className="sm:col-span-2" />
            </>
          ) : null}
          {user.userType === "agent" ? <TextField label="Social handle" name="socialHandle" defaultValue={user.agentProfile?.socialHandle} /> : null}
        </div>
        <fieldset>
          <legend className="field-label">Email notifications</legend>
          <div className="space-y-2 text-sm text-slate-700">
            <Check name="emailInquiries" label="New enquiries on my listings" def={prefs.emailInquiries ?? true} />
            <Check name="emailTransactions" label="Transactions and payouts" def={prefs.emailTransactions ?? true} />
            <Check name="weeklyNewsletter" label="Weekly newsletter" def={!!prefs.weeklyNewsletter} />
            <Check name="marketingEmails" label="Offers and product updates" def={!!prefs.marketingEmails} />
          </div>
        </fieldset>
        <SubmitButton className="btn-primary" pendingText="Saving…">Save profile</SubmitButton>
      </form>

      <form action={cAction} className="card h-fit space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Change password</h2>
        <FormMessage state={cState} />
        <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" />
        <PasswordField label="New password" name="newPassword" autoComplete="new-password" hint="At least 8 characters" />
        <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" />
        <SubmitButton className="btn-outline" pendingText="Updating…">Update password</SubmitButton>
      </form>
    </div>
  );
}

function Check({ name, label, def }: { name: string; label: string; def: boolean }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={def} className="size-4 rounded accent-brand-600" /> {label}
    </label>
  );
}
