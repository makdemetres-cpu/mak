import { OptionGroup } from "@/components/booking/fields/OptionGroup";
import type { BookingContent } from "@/content/booking";
import { URGENCY_VALUES, type UrgencyValue } from "@/lib/validation/booking";

export function StepUrgency({
  content,
  value,
  onChange,
  error,
}: {
  content: BookingContent["steps"]["urgency"];
  value: UrgencyValue | null;
  onChange: (value: UrgencyValue) => void;
  error?: string;
}) {
  return (
    <OptionGroup
      label={content.heading}
      value={value}
      onChange={onChange}
      error={error}
      options={URGENCY_VALUES.map((urgency) => ({
        value: urgency,
        title: content.options[urgency].title,
        body: content.options[urgency].body,
      }))}
    />
  );
}
