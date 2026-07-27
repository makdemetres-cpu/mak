import { Link } from "@/i18n/navigation";
import { Mono } from "@/components/primitives/Mono";
import { Hairline } from "@/components/primitives/Hairline";
import type { BookingContent } from "@/content/booking";
import type { BookingFormState } from "@/components/booking/types";
import type { ServiceDetail } from "@/content/services";

function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-line py-4">
      <div>
        <p className="text-sm text-bone-dim">{label}</p>
        <div className="mt-1 text-base text-bone">{value}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone"
      >
        {editLabel}
      </button>
    </div>
  );
}

export function StepReview({
  content,
  urgencyLabels,
  form,
  service,
  privacyHref,
  onGoToStep,
  onPrivacyChange,
  privacyError,
}: {
  content: BookingContent["steps"]["review"];
  urgencyLabels: BookingContent["urgencyLabels"];
  form: BookingFormState;
  service: ServiceDetail | undefined;
  privacyHref: string;
  onGoToStep: (step: number) => void;
  onPrivacyChange: (accepted: boolean) => void;
  privacyError?: string;
}) {
  return (
    <div>
      <div>
        <ReviewRow
          label={content.serviceLabel}
          value={service?.title}
          onEdit={() => onGoToStep(1)}
          editLabel={content.editLabel}
        />
        <ReviewRow
          label={content.urgencyLabel}
          value={form.urgency ? urgencyLabels[form.urgency] : null}
          onEdit={() => onGoToStep(2)}
          editLabel={content.editLabel}
        />
        <ReviewRow
          label={content.whereLabel}
          value={
            <>
              {form.address}, {form.postcode}
            </>
          }
          onEdit={() => onGoToStep(3)}
          editLabel={content.editLabel}
        />
        <ReviewRow
          label={content.whenLabel}
          value={
            <Mono className="text-base">
              {form.preferredDate} · {form.timeSlot}
            </Mono>
          }
          onEdit={() => onGoToStep(4)}
          editLabel={content.editLabel}
        />
        <ReviewRow
          label={content.contactLabel}
          value={
            <>
              {form.name} · {form.phone} · {form.email}
            </>
          }
          onEdit={() => onGoToStep(5)}
          editLabel={content.editLabel}
        />
        {form.notes && (
          <ReviewRow label={content.notesLabel} value={form.notes} onEdit={() => onGoToStep(5)} editLabel={content.editLabel} />
        )}
      </div>

      <Hairline className="mt-2" />

      <div className="mt-6 flex items-start gap-3">
        <input
          id="privacyAccepted"
          type="checkbox"
          checked={form.privacyAccepted}
          onChange={(event) => onPrivacyChange(event.target.checked)}
          aria-invalid={privacyError ? true : undefined}
          aria-describedby={privacyError ? "privacy-error" : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--brass)]"
        />
        <label htmlFor="privacyAccepted" className="text-sm text-bone-dim">
          {content.privacyPrefix}
          <Link
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone underline decoration-slate-line underline-offset-4 hover:text-brass-lite"
          >
            {content.privacyLinkText}
          </Link>
          {content.privacySuffix}
        </label>
      </div>
      {privacyError && (
        <p id="privacy-error" role="alert" className="mt-2 text-sm text-alert-text">
          {privacyError}
        </p>
      )}
    </div>
  );
}
