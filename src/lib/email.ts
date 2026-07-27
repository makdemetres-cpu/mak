import { Resend } from "resend";
import type { BookingInput } from "@/lib/validation/booking";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.BOOKING_FROM_EMAIL;
const notifyEmail = process.env.BOOKING_NOTIFY_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

let warnedMissingConfig = false;

function warnOnce(message: string) {
  if (!warnedMissingConfig) {
    console.warn(message);
    warnedMissingConfig = true;
  }
}

interface BookingEmailPayload {
  booking: BookingInput;
  reference: string;
  serviceTitle: string;
}

const copy = {
  el: {
    customerSubject: (ref: string) => `Η κράτησή σας επιβεβαιώθηκε — ${ref}`,
    heading: "Λάβαμε την κράτησή σας",
    body: (name: string) =>
      `Γεια σας ${name},\n\nΛάβαμε το αίτημά σας. Θα επικοινωνήσουμε σύντομα για επιβεβαίωση.`,
    reference: "Αριθμός αναφοράς",
    service: "Υπηρεσία",
    when: "Πότε",
    where: "Διεύθυνση",
    footer: "Αν χρειάζεστε να αλλάξετε κάτι, απαντήστε σε αυτό το email ή καλέστε μας.",
  },
  en: {
    customerSubject: (ref: string) => `Your booking is confirmed — ${ref}`,
    heading: "We've received your booking",
    body: (name: string) => `Hi ${name},\n\nWe've received your request. We'll be in touch shortly to confirm.`,
    reference: "Reference number",
    service: "Service",
    when: "When",
    where: "Address",
    footer: "If you need to change anything, reply to this email or call us.",
  },
} as const;

function renderCustomerEmail(payload: BookingEmailPayload): { subject: string; html: string; text: string } {
  const { booking, reference, serviceTitle } = payload;
  const t = copy[booking.locale];
  const when = `${booking.preferredDate} · ${booking.timeSlot}`;

  const text = [
    t.heading,
    "",
    t.body(booking.name),
    "",
    `${t.reference}: ${reference}`,
    `${t.service}: ${serviceTitle}`,
    `${t.when}: ${when}`,
    `${t.where}: ${booking.address}, ${booking.postcode}`,
    "",
    t.footer,
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;color:#14161A;max-width:520px;margin:0 auto">
      <h1 style="font-size:20px;font-weight:500">${t.heading}</h1>
      <p>${t.body(booking.name).replace(/\n/g, "<br/>")}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <tr><td style="padding:6px 0;color:#666">${t.reference}</td><td style="padding:6px 0;font-family:monospace">${reference}</td></tr>
        <tr><td style="padding:6px 0;color:#666">${t.service}</td><td style="padding:6px 0">${serviceTitle}</td></tr>
        <tr><td style="padding:6px 0;color:#666">${t.when}</td><td style="padding:6px 0">${when}</td></tr>
        <tr><td style="padding:6px 0;color:#666">${t.where}</td><td style="padding:6px 0">${booking.address}, ${booking.postcode}</td></tr>
      </table>
      <p style="margin-top:24px;color:#666;font-size:14px">${t.footer}</p>
    </div>
  `;

  return { subject: t.customerSubject(reference), html, text };
}

function renderBusinessEmail(payload: BookingEmailPayload): { subject: string; html: string; text: string } {
  const { booking, reference, serviceTitle } = payload;
  const when = `${booking.preferredDate} · ${booking.timeSlot}`;

  const lines = [
    `Νέα κράτηση — ${reference}`,
    "",
    `Επείγον: ${booking.urgency}`,
    `Υπηρεσία: ${serviceTitle}`,
    `Πότε: ${when}`,
    `Όνομα: ${booking.name}`,
    `Τηλέφωνο: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Διεύθυνση: ${booking.address}, ${booking.postcode}`,
    `Τύπος ακινήτου: ${booking.propertyType}`,
    booking.floor ? `Όροφος: ${booking.floor}` : null,
    booking.parkingNotes ? `Πάρκινγκ: ${booking.parkingNotes}` : null,
    booking.notes ? `Σημειώσεις: ${booking.notes}` : null,
  ].filter((line): line is string => Boolean(line));

  return {
    subject: `Νέα κράτηση — ${reference}`,
    text: lines.join("\n"),
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${lines.join("\n")}</pre>`,
  };
}

export async function sendBookingEmails(payload: BookingEmailPayload): Promise<void> {
  if (!resend || !fromEmail) {
    warnOnce(
      "[email] RESEND_API_KEY/BOOKING_FROM_EMAIL not set — booking emails are NOT being sent. The booking is still saved; set these before production launch.",
    );
    return;
  }

  const customer = renderCustomerEmail(payload);
  const business = renderBusinessEmail(payload);

  const sends = [
    resend.emails.send({
      from: fromEmail,
      to: payload.booking.email,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    }),
  ];

  if (notifyEmail) {
    sends.push(
      resend.emails.send({
        from: fromEmail,
        to: notifyEmail,
        subject: business.subject,
        html: business.html,
        text: business.text,
      }),
    );
  } else {
    warnOnce("[email] BOOKING_NOTIFY_EMAIL not set — the business is NOT being notified of new bookings.");
  }

  const results = await Promise.allSettled(sends);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[email] Failed to send booking email:", result.reason);
    }
  }
}
