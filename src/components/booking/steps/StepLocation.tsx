import { TextField } from "@/components/booking/fields/TextField";
import { OptionGroup } from "@/components/booking/fields/OptionGroup";
import type { BookingContent } from "@/content/booking";
import { PROPERTY_TYPES, type PropertyTypeValue } from "@/lib/validation/booking";
import type { FormErrors } from "@/components/booking/types";

export function StepLocation({
  content,
  address,
  postcode,
  propertyType,
  floor,
  parkingNotes,
  onChange,
  errors,
}: {
  content: BookingContent["steps"]["location"];
  address: string;
  postcode: string;
  propertyType: PropertyTypeValue | null;
  floor: string;
  parkingNotes: string;
  onChange: (
    patch: Partial<{
      address: string;
      postcode: string;
      propertyType: PropertyTypeValue;
      floor: string;
      parkingNotes: string;
    }>,
  ) => void;
  errors: FormErrors;
}) {
  return (
    <div className="space-y-6">
      <TextField
        label={content.address}
        required
        value={address}
        onChange={(v) => onChange({ address: v })}
        placeholder={content.addressPlaceholder}
        autoComplete="street-address"
        error={errors.address}
      />
      <TextField
        label={content.postcode}
        required
        value={postcode}
        onChange={(v) => onChange({ postcode: v })}
        placeholder={content.postcodePlaceholder}
        autoComplete="postal-code"
        error={errors.postcode}
      />

      <div>
        <p className="text-sm text-bone-dim">
          {content.propertyType}{" "}
          <span aria-hidden="true" className="text-brass">
            *
          </span>
        </p>
        <OptionGroup
          label={content.propertyType}
          className="mt-2"
          columns={3}
          value={propertyType}
          onChange={(v) => onChange({ propertyType: v })}
          error={errors.propertyType}
          options={PROPERTY_TYPES.map((type) => ({
            value: type,
            title: content.propertyTypeOptions[type],
          }))}
        />
      </div>

      <TextField
        label={content.floor}
        value={floor}
        onChange={(v) => onChange({ floor: v })}
        placeholder={content.floorPlaceholder}
      />
      <TextField
        label={content.parkingNotes}
        value={parkingNotes}
        onChange={(v) => onChange({ parkingNotes: v })}
        placeholder={content.parkingNotesPlaceholder}
      />
    </div>
  );
}
