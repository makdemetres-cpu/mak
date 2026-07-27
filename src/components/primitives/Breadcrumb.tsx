import { Link } from "@/i18n/navigation";

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-bone-dim">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-slate-line">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="hover:text-bone">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-bone">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
