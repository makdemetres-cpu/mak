import { PHONE_DISPLAY, PHONE_HREF } from "@/content/business";
import type { BookingContent } from "@/content/booking";
import { Button } from "@/components/primitives/Button";
import { Mono } from "@/components/primitives/Mono";

/**
 * Shown immediately when "Emergency, today" is selected — per the brief,
 * someone with a burst pipe shouldn't have to get through six form steps
 * before seeing a phone number. They can still continue online if they'd
 * rather.
 */
export function EmergencyInterstitial({
  content,
  onContinue,
}: {
  content: BookingContent["emergency"];
  onContinue: () => void;
}) {
  return (
    <div className="border border-alert-text/40 bg-slate p-6 sm:p-8">
      <h2 className="text-xl font-display text-bone">{content.heading}</h2>
      <p className="mt-3 max-w-[50ch] text-base text-bone-dim">{content.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button href={PHONE_HREF} variant="alert" ariaLabel={`${content.callCta}: ${PHONE_DISPLAY}`}>
          <Mono className="text-base">{PHONE_DISPLAY}</Mono>
        </Button>
        <button
          type="button"
          onClick={onContinue}
          className="text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone"
        >
          {content.continueCta}
        </button>
      </div>
    </div>
  );
}
