import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

const base =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const styles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-accent text-white hover:bg-brand-accent-hover focus-visible:outline-brand-accent',
  ghost:
    'bg-transparent text-brand-ink hover:bg-brand-line-soft',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
