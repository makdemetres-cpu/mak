import { Container } from "@/components/primitives/Container";
import { FadeRise } from "@/components/primitives/FadeRise";
import { Mono } from "@/components/primitives/Mono";
import type { HomeContent } from "@/content/home";

export function TrustStrip({ items }: { items: HomeContent["trust"] }) {
  return (
    <section className="border-y border-slate-line">
      <Container>
        <FadeRise>
          <dl className="grid grid-cols-1 divide-y divide-slate-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-6 sm:px-6 sm:py-8 sm:first:pl-0"
              >
                <dt>
                  <Mono className="text-mono-lg text-brass-lite">{item.value}</Mono>
                </dt>
                <dd className="text-sm text-bone-dim">{item.label}</dd>
              </div>
            ))}
          </dl>
        </FadeRise>
      </Container>
    </section>
  );
}
