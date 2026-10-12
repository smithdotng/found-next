"use client";

import { useActionState, useState } from "react";
import { saveOffering } from "@/app/actions/fractional";
import { FormMessage, SubmitButton, TextField } from "@/components/ui/form-bits";
import { SmartImage } from "@/components/ui/smart-image";
import { NIGERIAN_STATES, formatPrice, stateLabel } from "@/lib/format";
import { ASSET_LABEL, DEFAULT_FEES, PAYOUT_LABEL, developerProceeds, type OfferingDoc } from "@/lib/fractional";

const day = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fileCls = "field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-700";

export function OfferingForm({
  offering: o,
  isAdmin,
  locked,
  developers,
}: {
  offering?: OfferingDoc;
  isAdmin: boolean;
  /** Developer view of an offering that's in review or live: read-only. */
  locked?: boolean;
  developers?: { _id: string; label: string }[];
}) {
  const [state, action] = useActionState(saveOffering, null);
  const e = (k: string) => state?.errors?.[k];
  const [units, setUnits] = useState(o?.totalUnits ?? 1000);
  const [price, setPrice] = useState(o?.unitPrice ?? 50000);
  const [value, setValue] = useState(o?.totalValue ?? 50_000_000);
  const fees = o?.fees ?? DEFAULT_FEES;
  const proceeds = developerProceeds(units * price, fees.platform);
  const p = o?.projections ?? {};
  const unitsLocked = !!o && o.unitsSold > 0;

  return (
    <form action={action} className="space-y-8" noValidate>
      {o ? <input type="hidden" name="id" value={o._id} /> : null}
      <fieldset disabled={locked} className="space-y-8 disabled:opacity-70">
        <Section title="The property">
          {isAdmin && !o && developers?.length ? (
            <div>
              <label className="field-label" htmlFor="f-dev">Developer</label>
              <select id="f-dev" name="developerId" className="field" defaultValue="">
                <option value="">Found (this admin account)</option>
                {developers.map((d) => <option key={d._id} value={d._id}>{d.label}</option>)}
              </select>
            </div>
          ) : null}
          <TextField label="Offering name" name="title" defaultValue={o?.title} placeholder="e.g. Palm Court Residences, Katampe" required error={e("title")} />
          <TextField label="One-line summary" name="summary" defaultValue={o?.summary} maxLength={300} required error={e("summary")} hint="Shown on cards and in search results" />
          <div>
            <label className="field-label" htmlFor="f-desc">Full description</label>
            <textarea id="f-desc" name="description" rows={8} defaultValue={o?.description} className="field" placeholder="The site, the design, the market, who the tenants or buyers will be, and why this is a good investment. Leave a blank line between paragraphs." />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Property type" name="assetType" defaultValue={o?.assetType ?? "residential"} options={Object.entries(ASSET_LABEL)} />
            <Select label="Stage" name="stage" defaultValue={o?.stage ?? "off_plan"} options={[["off_plan", "Off-plan / under construction"], ["income", "Completed, earning rent"]]} />
            <Select label="Risk level" name="risk" defaultValue={o?.risk ?? "moderate"} options={[["low", "Lower"], ["moderate", "Moderate"], ["high", "Higher"]]} />
          </div>
          <div>
            <p className="field-label">How investors earn <span className="text-coral-500">*</span></p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="returnTypes" value="rental_income" defaultChecked={o ? o.returnTypes?.includes("rental_income") : true} className="size-4 rounded accent-brand-600" /> Rental income</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="returnTypes" value="capital_growth" defaultChecked={o ? o.returnTypes?.includes("capital_growth") : true} className="size-4 rounded accent-brand-600" /> Capital growth on sale</label>
            </div>
            {e("returnTypes") ? <p className="mt-1 text-xs text-rose-600">{e("returnTypes")}</p> : null}
          </div>
          <TextField label="Address" name="address" defaultValue={o?.location?.address} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="City / area" name="city" defaultValue={o?.location?.city} />
            <TextField label="LGA" name="lga" defaultValue={o?.location?.lga} />
            <div>
              <label className="field-label" htmlFor="f-state">State <span className="text-coral-500">*</span></label>
              <select id="f-state" name="state" className="field" defaultValue={o?.location?.state ?? ""}>
                <option value="">Select…</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
              </select>
              {e("state") ? <p className="mt-1 text-xs text-rose-600">{e("state")}</p> : null}
            </div>
          </div>
          <TextField label="Video tour link (optional)" name="videoUrl" type="url" defaultValue={o?.videoUrl} placeholder="YouTube or similar" />
        </Section>

        <Section title="The raise" text="Units × unit price should equal the amount you're raising. Many offerings use ₦50,000 units so more people can take part.">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Amount being raised (₦)" name="totalValue" inputMode="numeric" value={String(value || "")} onChange={(ev) => setValue(Number(ev.target.value.replace(/\D/g, "")))} required error={e("totalValue")} hint={value ? formatPrice(value) : undefined} />
            <TextField label="Number of units" name="totalUnits" inputMode="numeric" value={String(units || "")} onChange={(ev) => setUnits(Number(ev.target.value.replace(/\D/g, "")))} required error={e("totalUnits")} />
            <TextField label="Price per unit (₦)" name="unitPrice" inputMode="numeric" value={String(price || "")} onChange={(ev) => setPrice(Number(ev.target.value.replace(/\D/g, "")))} readOnly={unitsLocked} required error={e("unitPrice")} hint={unitsLocked ? "Locked: units have sold" : `= ${formatPrice(units * price)}`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Minimum units per investor" name="minUnits" type="number" min={1} defaultValue={o?.minUnits ?? 1} />
            <TextField label="Maximum units per investor" name="maxUnitsPerInvestor" type="number" min={1} defaultValue={o?.maxUnitsPerInvestor ?? ""} hint="Optional" error={e("maxUnitsPerInvestor")} />
            <TextField label="Minimum raise (%)" name="softCapPercent" type="number" min={10} max={100} defaultValue={o?.softCapPercent ?? 80} hint="Below this, investors are refunded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Opens on (optional)" name="opensAt" type="date" defaultValue={day(o?.opensAt)} />
            <TextField label="Closes on (optional)" name="closesAt" type="date" defaultValue={day(o?.closesAt)} error={e("closesAt")} />
          </div>
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            If fully funded: <strong className="text-ink">{formatPrice(proceeds.raised)}</strong> raised, Found&apos;s {fees.platform}% fee {formatPrice(proceeds.fee)},{" "}
            <strong className="text-ink">{formatPrice(proceeds.net)}</strong> released to the project.
          </p>
        </Section>

        <Section title="Targets and exit" text="Be realistic: Found reviews these against comparable properties and shows them to investors as targets, never promises.">
          <div className="grid gap-4 sm:grid-cols-4">
            <TextField label="Rental yield (% a year)" name="rentalYield" inputMode="decimal" defaultValue={p.rentalYield ?? ""} />
            <TextField label="Value growth (% a year)" name="appreciation" inputMode="decimal" defaultValue={p.appreciation ?? ""} />
            <TextField label="Term (months)" name="holdMonths" type="number" min={1} defaultValue={p.holdMonths ?? ""} />
            <TextField label="Completion date" name="completionDate" type="date" defaultValue={day(p.completionDate)} />
          </div>
          <Select label="Payout frequency" name="payoutFrequency" defaultValue={p.payoutFrequency ?? "quarterly"} options={Object.entries(PAYOUT_LABEL)} />
          <div>
            <label className="field-label" htmlFor="f-exit">Exit strategy</label>
            <textarea id="f-exit" name="exitStrategy" rows={3} defaultValue={p.exitStrategy} className="field" placeholder="How and when investors get their money back — e.g. units sold to end buyers on completion, or the building sold after 5 years of letting." />
          </div>
          <div>
            <label className="field-label" htmlFor="f-risks">Key risks</label>
            <textarea id="f-risks" name="riskNotes" rows={3} defaultValue={o?.riskNotes} className="field" placeholder="Construction, approvals, market and tenancy risks specific to this property, and how you're managing them." />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="resaleEnabled" defaultChecked={o?.resaleEnabled ?? true} className="size-4 rounded accent-brand-600" /> Let investors sell units to each other after the raise closes
          </label>
        </Section>

        <Section title="Ownership and payments" text="Each offering must be held by its own company (SPV). Investors pay into its escrow or custodial account.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="SPV name" name="spvName" defaultValue={o?.spv?.name} placeholder="e.g. Palm Court Katampe Ltd" />
            <TextField label="SPV RC number" name="spvRc" defaultValue={o?.spv?.rcNumber} />
            <TextField label="Trustee / custodian" name="trustee" defaultValue={o?.spv?.trustee} hint="SEC-registered trustee holding the title for investors" />
            <TextField label="Title document" name="titleDocument" defaultValue={o?.spv?.titleDocument} placeholder="e.g. Certificate of Occupancy" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Escrow bank" name="payBank" defaultValue={o?.paymentAccount?.bankName} />
            <TextField label="Account name" name="payAccountName" defaultValue={o?.paymentAccount?.accountName} />
            <TextField label="Account number" name="payAccountNumber" defaultValue={o?.paymentAccount?.accountNumber} inputMode="numeric" maxLength={10} hint="Leave blank to collect through Found" />
          </div>
        </Section>

        <Section title="Photos and documents" text="Investors see photos publicly. Documents are only shown to signed-in users.">
          {o?.images?.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {o.images.map((url) => (
                <label key={url} className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-slate-100">
                  <SmartImage src={url} alt="" fill sizes="160px" className="object-cover" />
                  <span className="absolute inset-x-1 bottom-1 flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] text-rose-700">
                    <input type="checkbox" name="removeImage" value={url} className="size-3 accent-rose-600" /> Remove
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          <div>
            <label className="field-label" htmlFor="f-images">Add photos</label>
            <input id="f-images" name="images" type="file" accept="image/*" multiple className={fileCls} />
            {e("images") ? <p className="mt-1 text-xs text-rose-600">{e("images")}</p> : <p className="field-hint">The first photo is the cover. Up to 5MB each.</p>}
          </div>
          {o?.documents?.length ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              {o.documents.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <a href={`/fractional/${o.slug}/doc/${d._id}`} target="_blank" className="min-w-0 truncate font-medium text-brand-700 hover:underline">{d.label} · <span className="font-normal text-slate-500">{d.name}</span></a>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-rose-700"><input type="checkbox" name="removeDoc" value={d._id} className="size-3 accent-rose-600" /> Remove</label>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
            <div>
              <label className="field-label" htmlFor="f-doclabel">Document type</label>
              <select id="f-doclabel" name="docLabel" className="field" defaultValue="Information memorandum">
                {["Information memorandum", "Title document", "Valuation report", "SPV incorporation (CAC)", "Trust deed", "Building approval", "Project budget", "Other"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="f-docs">Upload documents</label>
              <input id="f-docs" name="documents" type="file" accept="application/pdf,image/*" multiple className={fileCls} />
              {e("documents") ? <p className="mt-1 text-xs text-rose-600">{e("documents")}</p> : <p className="field-hint">PDF or image, up to 10MB each. Choose the type, upload, save, repeat.</p>}
            </div>
          </div>
        </Section>

        {isAdmin ? (
          <Section title="Found settings" text="Only visible to Found admins.">
            <div className="grid gap-4 sm:grid-cols-4">
              <TextField label="Platform fee %" name="feePlatform" inputMode="decimal" defaultValue={fees.platform} hint="From the developer" />
              <TextField label="Investor fee %" name="feeInvestor" inputMode="decimal" defaultValue={fees.investor} hint="Added to purchases" />
              <TextField label="Management fee %" name="feeManagement" inputMode="decimal" defaultValue={fees.management} hint="Of rental income" />
              <TextField label="Resale fee %" name="feeResale" inputMode="decimal" defaultValue={fees.resale} hint="From sellers" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="featured" defaultChecked={o?.featured} className="size-4 rounded accent-brand-600" /> Feature on /fractional
            </label>
          </Section>
        ) : null}
      </fieldset>

      {!locked ? (
        <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <SubmitButton className="btn-primary px-6" pendingText="Saving…">{o ? "Save changes" : "Save draft"}</SubmitButton>
          <div className="min-w-0 flex-1"><FormMessage state={state} /></div>
        </div>
      ) : null}
    </form>
  );
}

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {text ? <p className="text-sm text-slate-500">{text}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: [string, string][] }) {
  return (
    <div>
      <label className="field-label" htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} className="field" defaultValue={defaultValue}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
