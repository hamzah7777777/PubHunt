import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = 'primary', ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cx(
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'primary' &&
            'bg-neutral-900 text-white hover:bg-neutral-700 shadow-sm',
          variant === 'secondary' &&
            'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 shadow-sm',
          variant === 'ghost' &&
            'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
          className,
        )}
        {...props}
      />
    );
  },
);

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100',
        className,
      )}
      {...props}
    />
  );
});

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        'rounded-xl border border-neutral-200 bg-white p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-neutral-500">{children}</label>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-red-600">{children}</p>;
}

export function Brand({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cx(
        'font-semibold tracking-tight text-neutral-900',
        size === 'sm' ? 'text-sm' : 'text-2xl',
      )}
    >
      HSBC 8CS <span className="text-blue-900">Toastmasters</span>
    </span>
  );
}
