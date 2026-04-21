import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base shell for labeled controls (label, optional hint/error, spacing).
 * @feature max-ui
 */
export function MaxUiField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
  labelClassName
}) {
  return (
    <div className={cn('space-y-1', className)} data-max-ui="field">
      {label != null && label !== '' ? (
        <label htmlFor={htmlFor} className={cn('text-xs font-medium text-slate-600', labelClassName)}>
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
