"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/primitives/Container";
import { Button } from "@/components/primitives/Button";
import { ProgressIndicator } from "@/components/booking/ProgressIndicator";
import { EmergencyInterstitial } from "@/components/booking/EmergencyInterstitial";
import { SuccessScreen } from "@/components/booking/SuccessScreen";
import { StepService } from "@/components/booking/steps/StepService";
import { StepUrgency } from "@/components/booking/steps/StepUrgency";
import { StepLocation } from "@/components/booking/steps/StepLocation";
import { StepSchedule } from "@/components/booking/steps/StepSchedule";
import { StepContact } from "@/components/booking/steps/StepContact";
import { StepReview } from "@/components/booking/steps/StepReview";
import { initialBookingFormState, type BookingFormState, type FormErrors } from "@/components/booking/types";
import { formatStepLabel, type BookingContent } from "@/content/booking";
import type { ServiceDetail } from "@/content/services";
import type { AppLocale } from "@/i18n/routing";
import {
  HONEYPOT_FIELD_NAME,
  isValidBookingDate,
  isValidEmail,
  isValidGreekPhone,
  isValidGreekPostcode,
} from "@/lib/validation/booking";

const TOTAL_STEPS = 6;

function validateStep(step: number, form: BookingFormState, v: BookingContent["validation"]): FormErrors {
  const errors: FormErrors = {};

  if (step === 1) {
    if (!form.serviceSlug) errors.serviceSlug = v.selectOption;
  }

  if (step === 2) {
    if (!form.urgency) errors.urgency = v.selectOption;
  }

  if (step === 3) {
    if (!form.address.trim()) errors.address = v.required;
    if (!form.postcode.trim()) errors.postcode = v.required;
    else if (!isValidGreekPostcode(form.postcode)) errors.postcode = v.invalidPostcode;
    if (!form.propertyType) errors.propertyType = v.selectOption;
  }

  if (step === 4) {
    if (!form.preferredDate) errors.preferredDate = v.selectDate;
    else if (!isValidBookingDate(form.preferredDate)) errors.preferredDate = v.selectDate;
    if (!form.timeSlot) errors.timeSlot = v.selectSlot;
  }

  if (step === 5) {
    if (!form.name.trim()) errors.name = v.required;
    if (!form.phone.trim()) errors.phone = v.required;
    else if (!isValidGreekPhone(form.phone)) errors.phone = v.invalidPhone;
    if (!form.email.trim()) errors.email = v.required;
    else if (!isValidEmail(form.email)) errors.email = v.invalidEmail;
  }

  if (step === 6) {
    if (!form.privacyAccepted) errors.privacyAccepted = v.mustAcceptPrivacy;
  }

  return errors;
}

export function BookingWizard({
  content,
  services,
  locale,
}: {
  content: BookingContent;
  services: ServiceDetail[];
  locale: AppLocale;
}) {
  const [form, setForm] = useState<BookingFormState>(initialBookingFormState);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showEmergency, setShowEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const formRenderedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Date.now() is impure, so it can't be called during render (even as a
  // useRef initializer) — capture it as a side effect on mount instead.
  useEffect(() => {
    formRenderedAt.current = Date.now();
  }, []);

  function patch(fields: Partial<BookingFormState>) {
    setForm((prev) => ({ ...prev, ...fields }));
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    setErrors({});
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const stepErrors = validateStep(step, form, content.validation);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (step < TOTAL_STEPS) {
      goToStep(step + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = new FormData();
      body.set("locale", locale);
      body.set("serviceSlug", form.serviceSlug ?? "");
      body.set("urgency", form.urgency ?? "");
      body.set("preferredDate", form.preferredDate);
      body.set("timeSlot", form.timeSlot ?? "");
      body.set("address", form.address);
      body.set("postcode", form.postcode);
      body.set("propertyType", form.propertyType ?? "");
      body.set("floor", form.floor);
      body.set("parkingNotes", form.parkingNotes);
      body.set("name", form.name);
      body.set("phone", form.phone);
      body.set("email", form.email);
      body.set("notes", form.notes);
      body.set("privacyAccepted", String(form.privacyAccepted));
      body.set("formRenderedAt", String(formRenderedAt.current));
      body.set(HONEYPOT_FIELD_NAME, form.honeypot);
      if (form.photo) body.set("photo", form.photo);

      const response = await fetch("/api/bookings", { method: "POST", body });

      if (response.ok) {
        const data = await response.json();
        setSuccessReference(data.reference);
        return;
      }

      if (response.status === 409) setSubmitError(content.errors.slotTaken);
      else if (response.status === 429) setSubmitError(content.errors.rateLimited);
      else setSubmitError(content.errors.generic);
    } catch {
      setSubmitError(content.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  if (successReference) {
    return <SuccessScreen content={content.success} reference={successReference} />;
  }

  const stepMeta: Array<{ kicker: string; heading: string; intro?: string } | null> = [
    null,
    { kicker: content.steps.service.kicker, heading: content.steps.service.heading, intro: content.steps.service.intro },
    { kicker: content.steps.urgency.kicker, heading: content.steps.urgency.heading },
    { kicker: content.steps.location.kicker, heading: content.steps.location.heading },
    { kicker: content.steps.schedule.kicker, heading: content.steps.schedule.heading },
    { kicker: content.steps.contact.kicker, heading: content.steps.contact.heading },
    { kicker: content.steps.review.kicker, heading: content.steps.review.heading },
  ];

  const current = stepMeta[step];
  const selectedService = services.find((s) => s.slug === form.serviceSlug);

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <ProgressIndicator
          current={step}
          total={TOTAL_STEPS}
          label={formatStepLabel(content.stepLabelTemplate, step, TOTAL_STEPS)}
        />

        <form onSubmit={handleSubmit} noValidate className="mt-10">
          {/* Not mono: full labels, often Greek — see design-token comments elsewhere. */}
          <p className="text-sm text-brass tracking-[0.08em] uppercase">{current?.kicker}</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-display text-bone outline-none">
            {current?.heading}
          </h1>
          {current?.intro && <p className="mt-3 max-w-[50ch] text-base text-bone-dim">{current.intro}</p>}

          <div className="mt-8">
            {step === 1 && (
              <StepService
                content={content.steps.service}
                services={services}
                value={form.serviceSlug}
                onChange={(v) => patch({ serviceSlug: v })}
                error={errors.serviceSlug}
              />
            )}

            {step === 2 && !showEmergency && (
              <StepUrgency
                content={content.steps.urgency}
                value={form.urgency}
                onChange={(v) => {
                  patch({ urgency: v });
                  if (v === "EMERGENCY_TODAY") setShowEmergency(true);
                }}
                error={errors.urgency}
              />
            )}
            {step === 2 && showEmergency && (
              <EmergencyInterstitial content={content.emergency} onContinue={() => setShowEmergency(false)} />
            )}

            {step === 3 && (
              <StepLocation
                content={content.steps.location}
                address={form.address}
                postcode={form.postcode}
                propertyType={form.propertyType}
                floor={form.floor}
                parkingNotes={form.parkingNotes}
                onChange={patch}
                errors={errors}
              />
            )}

            {step === 4 && (
              <StepSchedule
                content={content.steps.schedule}
                preferredDate={form.preferredDate}
                timeSlot={form.timeSlot}
                onChange={patch}
                errors={errors}
              />
            )}

            {step === 5 && (
              <StepContact
                content={content.steps.contact}
                name={form.name}
                phone={form.phone}
                email={form.email}
                notes={form.notes}
                photo={form.photo}
                honeypot={form.honeypot}
                onChange={patch}
                onHoneypotChange={(v) => patch({ honeypot: v })}
                errors={errors}
              />
            )}

            {step === 6 && (
              <StepReview
                content={content.steps.review}
                urgencyLabels={content.urgencyLabels}
                form={form}
                service={selectedService}
                privacyHref="/privacy"
                onGoToStep={goToStep}
                onPrivacyChange={(accepted) => patch({ privacyAccepted: accepted })}
                privacyError={errors.privacyAccepted}
              />
            )}
          </div>

          {submitError && (
            <p role="alert" className="mt-6 text-sm text-alert-text">
              {submitError}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between border-t border-slate-line pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="text-sm text-bone-dim underline decoration-slate-line underline-offset-4 hover:text-bone"
              >
                {content.nav.back}
              </button>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? content.nav.submitting : step < TOTAL_STEPS ? content.nav.next : content.nav.submit}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
