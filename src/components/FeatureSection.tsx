import type { ReactNode } from "react";

interface FeatureSectionProps {
  id?: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function FeatureSection({
  id,
  title,
  description,
  className = "",
  children,
}: FeatureSectionProps) {
  return (
    <section id={id} className={`px-4 py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center sm:text-right">
          <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 text-zinc-600">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
