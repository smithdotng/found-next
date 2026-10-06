// Options for the property pre-verification checklist (shared by form, admin view and emails).

export const TITLE_TYPES = [
  { value: "c_of_o", label: "Certificate of Occupancy (C of O)" },
  { value: "r_of_o", label: "Right of Occupancy (R of O)" },
  { value: "governors_consent", label: "Governor's Consent" },
  { value: "deed_of_assignment", label: "Registered Deed of Assignment" },
  { value: "deed_of_conveyance", label: "Deed of Conveyance" },
  { value: "gazette_excision", label: "Gazette / Excision" },
  { value: "allocation_letter", label: "Letter of Allocation (e.g. FCDA/AGIS, State)" },
  { value: "survey_plan_only", label: "Registered Survey Plan only" },
  { value: "customary", label: "Customary / family purchase agreement & receipt" },
  { value: "other", label: "Other" },
] as const;

export const ENCUMBRANCES = [
  { value: "mortgage", label: "Mortgage, bank charge or lien" },
  { value: "litigation", label: "Court case or pending litigation" },
  { value: "acquisition", label: "Government acquisition or revocation notice" },
  { value: "family_dispute", label: "Family or community dispute" },
  { value: "caveat", label: "Caveat on the title" },
  { value: "tenancy", label: "Sitting tenant or existing lease" },
  { value: "unpaid_charges", label: "Unpaid ground rent, levies or charges" },
  { value: "other", label: "Other" },
] as const;

export const DOC_KINDS = [
  { value: "title", label: "Title document" },
  { value: "survey", label: "Survey plan" },
  { value: "authority", label: "Letter of authority" },
  { value: "other", label: "Other supporting document" },
] as const;

export const PREVERIFY_STATUS = {
  none: { label: "Not started", tone: "bg-slate-100 text-slate-600" },
  submitted: { label: "Submitted", tone: "bg-amber-50 text-amber-700" },
  needs_changes: { label: "Changes requested", tone: "bg-rose-50 text-rose-700" },
  accepted: { label: "Checked by Found", tone: "bg-emerald-50 text-emerald-700" },
} as const;

export type PreVerifyStatus = keyof typeof PREVERIFY_STATUS;

export const labelFor = (list: readonly { value: string; label: string }[], v?: string) => list.find((x) => x.value === v)?.label ?? v ?? "";
