"use client";

import { useActionState, useMemo, useState } from "react";
import { marked } from "marked";
import { Eye, PenLine, Send, FlaskConical } from "lucide-react";
import clsx from "clsx";
import { sendNewsletter, sendTestNewsletter } from "@/app/actions/newsletter";
import { FormMessage, SubmitButton } from "@/components/ui/form-bits";
import { AUDIENCES } from "@/lib/newsletter";

type State = { ok: boolean; message: string } | null;

const STARTER = `Hello,

Here's what's new on **Found** this month.

## New listings in your area

- Serviced apartments in Wuse 2 and Maitama
- Dry land with C of O in Guzape

[Browse the latest properties](https://found.ng/properties)

Thanks for listing with us,
The Found team`;

export function NewsletterComposer({ counts, adminEmail }: { counts: Record<string, number>; adminEmail: string }) {
  const [sendState, sendAction] = useActionState<State, FormData>(sendNewsletter, null);
  const [testState, testAction] = useActionState<State, FormData>(sendTestNewsletter, null);
  const [content, setContent] = useState(STARTER);
  const [audience, setAudience] = useState<string>("realtors_optin");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const preview = useMemo(() => marked.parse(content, { async: false, breaks: true }) as string, [content]);
  const count = counts[audience] ?? 0;
  const label = AUDIENCES.find((a) => a.value === audience)?.label ?? audience;

  return (
    <form
      action={sendAction}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.dataset.test) return;
        if (!confirm(`Send this newsletter to ${count.toLocaleString()} ${label.toLowerCase()}?`)) e.preventDefault();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <section className="card p-5 sm:p-6">
        <label className="field-label" htmlFor="nl-subject">Subject</label>
        <input id="nl-subject" name="subject" required className="field" placeholder="e.g. New Abuja listings this month" />

        <div className="mt-5 flex items-center justify-between">
          <span className="field-label !mb-0">Message</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-sm">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={clsx("inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium capitalize", tab === t ? "bg-white text-ink shadow-sm" : "text-slate-500")}
              >
                {t === "write" ? <PenLine className="size-3.5" /> : <Eye className="size-3.5" />} {t}
              </button>
            ))}
          </div>
        </div>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className={clsx("field mt-2 font-mono text-[13px] leading-6", tab === "preview" && "hidden")}
        />
        {tab === "preview" ? (
          <div className="prose-found mt-2 min-h-[26rem] rounded-xl border border-slate-200 bg-white p-5" dangerouslySetInnerHTML={{ __html: preview }} />
        ) : null}
        <p className="field-hint">
          Write in Markdown: <code>**bold**</code>, <code>## heading</code>, <code>- list</code>, <code>[link](https://…)</code>. HTML also works. It&apos;s wrapped in the branded Found email template with an unsubscribe link.
        </p>
      </section>

      <aside className="space-y-4">
        <section className="card p-5">
          <h2 className="font-semibold text-ink">Audience</h2>
          <div className="mt-3 space-y-1.5">
            {AUDIENCES.map((a) => (
              <label key={a.value} className={clsx("flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ring-1", audience === a.value ? "bg-brand-50 ring-brand-300" : "ring-slate-200 hover:bg-slate-50")}>
                <span className="flex items-center gap-2">
                  <input type="radio" name="audience" value={a.value} checked={audience === a.value} onChange={() => setAudience(a.value)} className="accent-brand-600" />
                  {a.label}
                </span>
                <span className="text-xs tabular-nums text-slate-500">{(counts[a.value] ?? 0).toLocaleString()}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <SubmitButton pendingText="Starting…">
              <Send className="size-4" /> Send to {count.toLocaleString()}
            </SubmitButton>
            <FormMessage state={sendState} />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold text-ink"><FlaskConical className="size-4 text-slate-400" /> Send a test</h2>
          <input name="testTo" type="email" className="field mt-3" placeholder={adminEmail} aria-label="Test email address" />
          <button formAction={testAction} data-test="1" className="btn-outline mt-2 w-full">Send test email</button>
          <div className="mt-2"><FormMessage state={testState} /></div>
        </section>
      </aside>
    </form>
  );
}
