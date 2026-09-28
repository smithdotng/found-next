"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

export type PhotoItem =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; preview: string };

const MAX = 10;

/** Shrinks large phone photos before upload (max 2000px, JPEG ~82%) to save data and time. */
async function compress(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoManager({ items, onChange, error }: { items: PhotoItem[]; onChange: (next: PhotoItem[]) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(
    () => () => items.forEach((i) => i.kind === "new" && URL.revokeObjectURL(i.preview)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const add = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const room = MAX - items.length;
      if (!list.length) return;
      if (room <= 0) {
        setNote(`You can add up to ${MAX} photos.`);
        return;
      }
      setBusy(true);
      const prepared: PhotoItem[] = [];
      for (const f of list.slice(0, room)) {
        const file = await compress(f);
        if (file.size > 5 * 1024 * 1024) {
          setNote(`${f.name} is larger than 5MB and was skipped.`);
          continue;
        }
        prepared.push({ id: crypto.randomUUID(), kind: "new", file, preview: URL.createObjectURL(file) });
      }
      setBusy(false);
      if (list.length > room) setNote(`Only ${room} more photo${room === 1 ? "" : "s"} could be added (max ${MAX}).`);
      onChange([...items, ...prepared]);
    },
    [items, onChange],
  );

  const move = (i: number, d: number) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const makeCover = (i: number) => onChange([items[i], ...items.filter((_, k) => k !== i)]);
  const remove = (i: number) => {
    const it = items[i];
    if (it.kind === "new") URL.revokeObjectURL(it.preview);
    onChange(items.filter((_, k) => k !== i));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={clsx(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          drag ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50/60",
          error && "border-rose-300",
        )}
      >
        {busy ? <Loader2 className="size-7 animate-spin text-brand-600" /> : <ImagePlus className="size-7 text-slate-400" />}
        <p className="mt-3 text-sm font-semibold text-ink">Drag photos here or</p>
        <button type="button" onClick={() => input.current?.click()} className="btn-outline btn-sm mt-2">
          Choose photos
        </button>
        <p className="mt-2 text-xs text-slate-500">JPG, PNG or WebP · up to {MAX} photos · large images are resized automatically</p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {note ? <p className="mt-2 text-xs text-amber-700">{note}</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {items.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.id} className={clsx("group relative overflow-hidden rounded-xl bg-slate-100 ring-2", i === 0 ? "ring-brand-500" : "ring-transparent")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.kind === "new" ? it.preview : it.url} alt="" className="aspect-[4/3] w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Star className="size-3 fill-white" /> Cover
                </span>
              ) : null}
              {it.kind === "new" ? <span className="absolute right-2 top-2 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span> : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}><ArrowLeft className="size-3.5" /></IconBtn>
                  <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowRight className="size-3.5" /></IconBtn>
                </div>
                <div className="flex gap-1">
                  {i !== 0 ? <IconBtn label="Make cover photo" onClick={() => makeCover(i)}><Star className="size-3.5" /></IconBtn> : null}
                  <IconBtn label="Remove photo" onClick={() => remove(i)} danger><Trash2 className="size-3.5" /></IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx("grid size-7 place-items-center rounded-md bg-white/90 text-ink transition disabled:opacity-30", danger ? "hover:bg-rose-600 hover:text-white" : "hover:bg-white")}
    >
      {children}
    </button>
  );
}
