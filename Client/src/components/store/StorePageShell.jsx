import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** @feature kitchen-store — Shared layout primitives for store manager/operator pages. */
const toneStyles = {
  sky: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-teal-600',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-teal-100 text-teal-700',
    notice: 'border-teal-200/80 bg-teal-50 text-teal-900'
  },
  emerald: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-emerald-600',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-emerald-100 text-emerald-700',
    notice: 'border-emerald-200/80 bg-emerald-50 text-emerald-900'
  },
  amber: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-amber-500',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-amber-100 text-amber-800',
    notice: 'border-amber-200/80 bg-amber-50 text-amber-950'
  },
  rose: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-rose-600',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-rose-100 text-rose-700',
    notice: 'border-rose-200/80 bg-rose-50 text-rose-900'
  },
  violet: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-violet-600',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-violet-100 text-violet-700',
    notice: 'border-violet-200/80 bg-violet-50 text-violet-900'
  },
  slate: {
    card: 'border-slate-200/80 bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/90',
    sectionAccent: 'bg-slate-600',
    stat: 'border-slate-200/80 bg-white',
    statIconWrap: 'bg-slate-100 text-slate-700',
    notice: 'border-slate-200 bg-slate-50 text-slate-800'
  }
};

const StatIcon = ({ tone }) => {
  const wrap = toneStyles[tone]?.statIconWrap ?? toneStyles.sky.statIconWrap;
  if (tone === 'amber') {
    return (
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', wrap)} aria-hidden>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </span>
    );
  }
  if (tone === 'rose') {
    return (
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', wrap)} aria-hidden>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
        </svg>
      </span>
    );
  }
  if (tone === 'emerald') {
    return (
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', wrap)} aria-hidden>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v5.25m4.5-9v9m4.5-13.5v13.5" />
        </svg>
      </span>
    );
  }
  if (tone === 'slate' || tone === 'violet') {
    return (
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', wrap)} aria-hidden>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </span>
    );
  }
  return (
    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', wrap)} aria-hidden>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </span>
  );
};

/** Table + list-friendly wrapper for rounded panels and zebra rows (design only). */
export const StoreTableFrame = ({ children, className }) => (
  <div
    className={cn(
      'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm',
      '[&_tbody_tr:nth-child(even)]:bg-slate-50/80 [&_thead_tr]:bg-slate-100/90 [&_th]:text-slate-600 [&_th]:font-semibold',
      className
    )}
  >
    {children}
  </div>
);

/** Teal primary/outline inside store pages only (matches inventory reference). */
const storeShellButtonScope =
  '[&_button.bg-sky-600]:!bg-teal-600 [&_button.bg-sky-600]:hover:!bg-teal-700 [&_button.border-sky-200]:!border-teal-200/80 [&_button.bg-sky-50]:!bg-teal-50/85 [&_button.text-sky-800]:!text-teal-900 [&_button.border-sky-200]:hover:!bg-teal-100/90 [&_button.border-sky-200]:hover:!text-teal-950';

export const StorePageShell = ({ children, className }) => (
  <div className={cn('min-h-screen bg-[#eef2f5] p-4 sm:p-6 lg:p-8', storeShellButtonScope)}>
    <div className={cn('mx-auto max-w-7xl space-y-6', className)}>{children}</div>
  </div>
);

export const StorePageHeader = ({ title, description, actions = null, tone = 'sky' }) => (
  <Card
    className={cn(
      'overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-200/40',
      toneStyles[tone]?.card
    )}
  >
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
      <div className="space-y-2">
        <CardTitle className={cn('text-3xl font-bold tracking-tight', toneStyles[tone]?.title)}>{title}</CardTitle>
        {description ? (
          <CardDescription className={cn('text-base text-slate-600', toneStyles[tone]?.description)}>
            {description}
          </CardDescription>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 [&_button]:rounded-xl [&_a]:rounded-xl">{actions}</div>
      ) : null}
    </CardHeader>
  </Card>
);

const sectionTableStyles =
  '[&_table]:w-full [&_tbody_tr:nth-child(even)]:bg-slate-50/75 [&_thead_tr]:bg-slate-100/85 [&_th]:font-semibold [&_th]:text-slate-600 [&_tr]:border-slate-100';

export const StoreSection = ({
  title,
  description,
  children,
  className,
  headerActions = null,
  tone = 'slate',
  compact = false
}) => (
  <Card
    className={cn(
      'overflow-hidden border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-200/30',
      compact ? 'rounded-xl' : 'rounded-2xl',
      className
    )}
  >
    {title || description || headerActions ? (
      <CardHeader
        className={cn(
          'flex flex-col sm:flex-row sm:items-start sm:justify-between',
          compact ? 'gap-2 !p-3 sm:!p-3' : 'gap-3',
          toneStyles[tone]?.sectionHeader
        )}
      >
        <div className={cn(compact ? 'space-y-0.5' : 'space-y-1')}>
          {title ? (
            <CardTitle
              className={cn(
                'flex items-center font-semibold',
                toneStyles[tone]?.title,
                compact ? 'gap-1.5 text-sm' : 'gap-2 text-xl'
              )}
            >
              <span
                className={cn(
                  'inline-block shrink-0 rounded-full',
                  toneStyles[tone]?.sectionAccent,
                  compact ? 'h-1.5 w-1.5' : 'h-2 w-2'
                )}
              />
              {title}
            </CardTitle>
          ) : null}
          {description ? (
            <CardDescription
              className={cn(
                compact ? 'text-xs leading-snug' : 'text-slate-600',
                toneStyles[tone]?.description
              )}
            >
              {description}
            </CardDescription>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex flex-wrap gap-2 [&_button]:rounded-xl [&_a]:rounded-xl">{headerActions}</div>
        ) : null}
      </CardHeader>
    ) : null}
    <CardContent
      className={cn(
        compact
          ? cn(
              sectionTableStyles,
              'space-y-2 !px-3 !pb-3',
              title || description || headerActions ? '!pt-2' : '!p-3 !py-3'
            )
          : cn(
              title || description || headerActions ? '' : 'p-6',
              'space-y-4 pb-6',
              sectionTableStyles
            )
      )}
    >
      {children}
    </CardContent>
  </Card>
);

export const StoreStatGrid = ({ children, className }) => (
  <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
);

export const StoreStatCard = ({ label, value, helper = null, tone = 'sky' }) => (
  <Card
    className={cn(
      'overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-200/25',
      toneStyles[tone]?.stat
    )}
  >
    <CardContent className="flex items-start gap-4 p-5">
      <StatIcon tone={tone} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={cn('text-3xl font-bold tracking-tight text-slate-900')}>{value}</p>
        {helper ? <p className={cn('text-xs text-slate-500', toneStyles[tone]?.description)}>{helper}</p> : null}
      </div>
    </CardContent>
  </Card>
);

export const StoreNotice = ({ children, tone = 'sky', className }) => (
  <div
    className={cn(
      'rounded-xl border px-4 py-3 text-sm shadow-sm',
      toneStyles[tone]?.notice,
      className
    )}
  >
    {children}
  </div>
);
