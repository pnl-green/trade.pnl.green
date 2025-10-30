import { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string | ReactNode;
}

const FeatureCard = ({ title, description }: FeatureCardProps) => (
  <div className="rounded-xl border border-border bg-surface/60 p-6 shadow-sm transition-shadow hover:shadow-md">
    <h3 className="font-heading text-lg text-ink">{title}</h3>
    {typeof description === 'string' ? (
      <p className="mt-3 text-sm text-steel">{description}</p>
    ) : (
      <div className="mt-3 text-sm text-steel">{description}</div>
    )}
  </div>
);

export default FeatureCard;
