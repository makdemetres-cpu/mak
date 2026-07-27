import { Container } from "@/components/primitives/Container";
import { Button } from "@/components/primitives/Button";
import { Mono } from "@/components/primitives/Mono";
import type { BookingContent } from "@/content/booking";

export function SuccessScreen({
  content,
  reference,
}: {
  content: BookingContent["success"];
  reference: string;
}) {
  return (
    <Container className="py-20 sm:py-28">
      <div role="status" className="max-w-[60ch]">
        <h1 className="text-2xl font-display text-bone">{content.heading}</h1>
        <p className="mt-4 text-base text-bone-dim">{content.body}</p>
        <div className="mt-8 border border-slate-line bg-slate p-6">
          <p className="text-sm text-bone-dim uppercase tracking-[0.08em]">{content.referenceLabel}</p>
          <Mono className="mt-2 block text-mono-lg text-brass-lite">{reference}</Mono>
        </div>
        <Button href="/" variant="primary" className="mt-8">
          {content.ctaHome}
        </Button>
      </div>
    </Container>
  );
}
