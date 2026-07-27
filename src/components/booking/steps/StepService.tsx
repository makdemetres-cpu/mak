import { OptionGroup } from "@/components/booking/fields/OptionGroup";
import type { BookingContent } from "@/content/booking";
import type { ServiceDetail } from "@/content/services";
import type { ServiceSlug } from "@/lib/validation/booking";

export function StepService({
  content,
  services,
  value,
  onChange,
  error,
}: {
  content: BookingContent["steps"]["service"];
  services: ServiceDetail[];
  value: ServiceSlug | null;
  onChange: (value: ServiceSlug) => void;
  error?: string;
}) {
  return (
    <OptionGroup
      label={content.heading}
      value={value}
      onChange={onChange}
      error={error}
      options={services.map((service) => ({
        value: service.slug as ServiceSlug,
        title: service.title,
        body: service.summary,
        number: service.number,
      }))}
    />
  );
}
