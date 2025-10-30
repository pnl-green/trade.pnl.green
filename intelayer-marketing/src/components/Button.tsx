import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black hover:bg-green-700 disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center rounded-xl border border-green-500/40 bg-transparent px-5 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-green-400 transition hover:text-green-200 hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={clsx(variantClassNames[variant], className)} {...props} />
  ),
);

Button.displayName = 'Button';

export default Button;
