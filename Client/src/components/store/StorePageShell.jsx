import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const toneStyles = {
  sky: {
    card: 'border-sky-200/80 bg-gradient-to-r from-sky-50 via-white to-cyan-50',
    title: 'text-sky-950',
    description: 'text-sky-700',
    sectionHeader: 'border-b border-sky-100 bg-sky-50/60',
    sectionAccent: 'bg-sky-500',
    stat: 'border-sky-200/80 bg-gradient-to-br from-sky-50 to-white',
    notice: 'border-sky-200 bg-sky-50 text-sky-800'
  },
  emerald: {
    card: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50',
    title: 'text-emerald-950',
    description: 'text-emerald-700',
    sectionHeader: 'border-b border-emerald-100 bg-emerald-50/60',
    sectionAccent: 'bg-emerald-500',
    stat: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white',
    notice: 'border-emerald-200 bg-emerald-50 text-emerald-800'
  },
  amber: {
    card: 'border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-orange-50',
    title: 'text-amber-950',
    description: 'text-amber-700',
    sectionHeader: 'border-b border-amber-100 bg-amber-50/60',
    sectionAccent: 'bg-amber-500',
    stat: 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-white',
    notice: 'border-amber-200 bg-amber-50 text-amber-800'
  },
  rose: {
    card: 'border-rose-200/80 bg-gradient-to-r from-rose-50 via-white to-pink-50',
    title: 'text-rose-950',
    description: 'text-rose-700',
    sectionHeader: 'border-b border-rose-100 bg-rose-50/60',
    sectionAccent: 'bg-rose-500',
    stat: 'border-rose-200/80 bg-gradient-to-br from-rose-50 to-white',
    notice: 'border-rose-200 bg-rose-50 text-rose-800'
  },
  violet: {
    card: 'border-violet-200/80 bg-gradient-to-r from-violet-50 via-white to-indigo-50',
    title: 'text-violet-950',
    description: 'text-violet-700',
    sectionHeader: 'border-b border-violet-100 bg-violet-50/60',
    sectionAccent: 'bg-violet-500',
    stat: 'border-violet-200/80 bg-gradient-to-br from-violet-50 to-white',
    notice: 'border-violet-200 bg-violet-50 text-violet-800'
  },
  slate: {
    card: 'border-slate-200 bg-white',
    title: 'text-slate-950',
    description: 'text-slate-600',
    sectionHeader: 'border-b border-slate-100 bg-slate-50/70',
    sectionAccent: 'bg-slate-500',
    stat: 'border-slate-200 bg-white',
    notice: 'border-slate-200 bg-slate-50 text-slate-700'
  }
};

export const StorePageShell = ({ children, className }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-violet-50/40 p-6">
    <div className={cn("mx-auto max-w-6xl space-y-4", className)}>{children}</div>
  </div>
);

export const StorePageHeader = ({ title, description, actions = null, tone = 'sky' }) => (
  <Card className={cn('overflow-hidden shadow-sm', toneStyles[tone]?.card)}>
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className={cn('mb-2 h-1.5 w-16 rounded-full', toneStyles[tone]?.sectionAccent)} />
        <CardTitle className={cn('text-2xl', toneStyles[tone]?.title)}>{title}</CardTitle>
        {description ? <CardDescription className={toneStyles[tone]?.description}>{description}</CardDescription> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </CardHeader>
  </Card>
);

export const StoreSection = ({ title, description, children, className, headerActions = null, tone = 'slate' }) => (
  <Card className={cn('overflow-hidden shadow-sm', className)}>
    {(title || description || headerActions) ? (
      <CardHeader className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', toneStyles[tone]?.sectionHeader)}>
        <div className="space-y-1">
          {title ? (
            <CardTitle className={cn('flex items-center gap-2 text-lg', toneStyles[tone]?.title)}>
              <span className={cn('inline-block h-2.5 w-2.5 rounded-full', toneStyles[tone]?.sectionAccent)} />
              {title}
            </CardTitle>
          ) : null}
          {description ? <CardDescription className={toneStyles[tone]?.description}>{description}</CardDescription> : null}
        </div>
        {headerActions ? <div className="flex flex-wrap gap-2">{headerActions}</div> : null}
      </CardHeader>
    ) : null}
    <CardContent className={cn(title || description || headerActions ? "" : "p-4", "space-y-4")}>
      {children}
    </CardContent>
  </Card>
);

export const StoreStatGrid = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
);

export const StoreStatCard = ({ label, value, helper = null, tone = 'sky' }) => (
  <Card className={cn('overflow-hidden shadow-sm', toneStyles[tone]?.stat)}>
    <CardContent className="p-4">
      <div className={cn('mb-3 h-1.5 w-12 rounded-full', toneStyles[tone]?.sectionAccent)} />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', toneStyles[tone]?.title)}>{value}</p>
      {helper ? <p className={cn('mt-1 text-xs', toneStyles[tone]?.description)}>{helper}</p> : null}
    </CardContent>
  </Card>
);

export const StoreNotice = ({ children, tone = 'sky', className }) => (
  <div className={cn('rounded-md border px-3 py-2 text-sm shadow-sm', toneStyles[tone]?.notice, className)}>
    {children}
  </div>
);
