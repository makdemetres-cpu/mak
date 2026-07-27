"use client";

import { useId, useRef } from "react";
import { TextField } from "@/components/booking/fields/TextField";
import { TextArea } from "@/components/booking/fields/TextArea";
import type { BookingContent } from "@/content/booking";
import { ALLOWED_PHOTO_TYPES, HONEYPOT_FIELD_NAME, MAX_PHOTO_BYTES } from "@/lib/validation/booking";
import type { FormErrors } from "@/components/booking/types";

export function StepContact({
  content,
  name,
  phone,
  email,
  notes,
  photo,
  honeypot,
  onChange,
  onHoneypotChange,
  errors,
}: {
  content: BookingContent["steps"]["contact"];
  name: string;
  phone: string;
  email: string;
  notes: string;
  photo: File | null;
  honeypot: string;
  onChange: (patch: Partial<{ name: string; phone: string; email: string; notes: string; photo: File | null }>) => void;
  onHoneypotChange: (value: string) => void;
  errors: FormErrors;
}) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      onChange({ photo: null });
      // Surfaced by the parent's photo error state on next validation pass.
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      onChange({ photo: null });
      return;
    }
    onChange({ photo: file });
  }

  return (
    <div className="relative space-y-6">
      <TextField
        label={content.name}
        required
        value={name}
        onChange={(v) => onChange({ name: v })}
        placeholder={content.namePlaceholder}
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label={content.phone}
        required
        type="tel"
        value={phone}
        onChange={(v) => onChange({ phone: v })}
        placeholder={content.phonePlaceholder}
        autoComplete="tel"
        error={errors.phone}
      />
      <TextField
        label={content.email}
        required
        type="email"
        value={email}
        onChange={(v) => onChange({ email: v })}
        placeholder={content.emailPlaceholder}
        autoComplete="email"
        error={errors.email}
      />
      <TextArea
        label={content.notes}
        value={notes}
        onChange={(v) => onChange({ notes: v })}
        placeholder={content.notesPlaceholder}
      />

      <div>
        <label htmlFor={fileInputId} className="block text-sm text-bone-dim">
          {content.photo}
        </label>
        <p className="mt-1 text-sm text-bone-dim/70">{content.photoHint}</p>

        {photo ? (
          <div className="mt-3 flex items-center gap-4 border border-slate-line px-4 py-3">
            <span className="flex-1 truncate text-sm text-bone">{photo.name}</span>
            <button
              type="button"
              onClick={() => {
                onChange({ photo: null });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone"
            >
              {content.photoRemove}
            </button>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(event) => handleFileSelect(event.target.files)}
            className="mt-3 w-full border border-slate-line bg-transparent px-4 py-3 text-sm text-bone-dim file:mr-4 file:border-0 file:bg-slate file:px-3 file:py-1.5 file:text-bone"
          />
        )}
        {errors.photo && (
          <p role="alert" className="mt-2 text-sm text-alert-text">
            {errors.photo}
          </p>
        )}
      </div>

      {/*
        Honeypot: visually hidden (off-screen, not display:none — some
        bots skip that), unreachable by keyboard, and excluded from the
        accessibility tree, so it's invisible to every real visitor and
        irrelevant to screen readers, but a form-filling bot that reads
        raw HTML will populate it anyway.
      */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="companyWebsite">Company website</label>
        <input
          id="companyWebsite"
          name={HONEYPOT_FIELD_NAME}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => onHoneypotChange(event.target.value)}
        />
      </div>
    </div>
  );
}
