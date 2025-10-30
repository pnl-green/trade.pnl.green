import { clsx } from 'clsx';
import { ReactNode } from 'react';

type SectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
  background?: 'page' | 'surface';
};

const Section = ({ id, className, children, background = 'page' }: SectionProps) => (
  <section
    id={id}
    className={clsx(
      'relative py-20',
      background === 'page' ? 'bg-page' : 'bg-surface',
      className,
    )}
  >
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_30%_at_80%_0%,rgba(21,211,128,0.15)_0%,rgba(21,211,128,0)_70%)]"
      aria-hidden
    />
    <div className="relative container">{children}</div>
  </section>
);

export default Section;
