import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-card border border-brand-line bg-white p-5 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
