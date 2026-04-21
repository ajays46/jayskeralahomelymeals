import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MAX_UI_CONTROL_CLASS } from './maxUiFieldStyles';
import { MaxUiField } from './MaxUiField';

/**
 * Native `<select>` with Max UI styling; optional integrated {@link MaxUiField} label.
 * @feature max-ui
 */
export const MaxUiComboBox = forwardRef(function MaxUiComboBox(
  {
    label,
    id,
    hint,
    error,
    required,
    fieldClassName,
    labelClassName,
    controlClassName,
    className,
    children,
    ...selectProps
  },
  ref
) {
  const mergedControl = cn(MAX_UI_CONTROL_CLASS, 'w-full', controlClassName, className);
  const selectEl = (
    <select ref={ref} id={id} required={required} className={mergedControl} {...selectProps}>
      {children}
    </select>
  );

  if (label != null && label !== '') {
    return (
      <MaxUiField
        label={label}
        htmlFor={id}
        required={required}
        hint={hint}
        error={error}
        className={fieldClassName}
        labelClassName={labelClassName}
      >
        {selectEl}
      </MaxUiField>
    );
  }

  return (
    <>
      {selectEl}
      {error ? (
        <p className="mt-1 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </>
  );
});
