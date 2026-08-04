'use client';

import React, { useState } from 'react';

export interface DatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  /** Today, supplied by the parent after mount so SSR and hydration agree. */
  today: Date;
  /** How far ahead tours can be booked. */
  daysAhead?: number;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = startOfDay(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** The nursery is closed at weekends, so tours cannot be booked then. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isBookableDate(date: Date, today: Date, daysAhead: number): boolean {
  const day = startOfDay(date);
  const first = startOfDay(today);
  const last = addDays(first, daysAhead);
  return day >= first && day <= last && !isWeekend(day);
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Month grid limited to the bookable window. Days outside the window, days in
 * the past and weekends are rendered as disabled buttons rather than removed,
 * so the grid keeps its shape and screen readers still announce why a date
 * cannot be chosen.
 */
export function DatePicker({
  selectedDate,
  onSelectDate,
  today,
  daysAhead = 30,
  className,
}: DatePickerProps) {
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
  );

  const lastBookable = addDays(today, daysAhead);
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  // Only allow paging within months that contain bookable days.
  const canGoBack =
    viewMonth.getFullYear() > today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() > today.getMonth());
  const canGoForward =
    viewMonth.getFullYear() < lastBookable.getFullYear() ||
    (viewMonth.getFullYear() === lastBookable.getFullYear() &&
      viewMonth.getMonth() < lastBookable.getMonth());

  const changeMonth = (delta: number): void =>
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const cells: Array<Date | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1),
    ),
  ];

  return (
    <div className={cx('w-full', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <p aria-live="polite" className="text-base font-semibold text-gray-800">
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Choose a tour date">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="pb-1 text-center text-xs font-semibold text-gray-500"
          >
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} aria-hidden="true" />;

          const bookable = isBookableDate(date, today, daysAhead);
          const selected = selectedDate !== null && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const label = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });

          return (
            <button
              key={formatIsoDate(date)}
              type="button"
              disabled={!bookable}
              onClick={() => onSelectDate(date)}
              aria-label={bookable ? label : `${label}, unavailable`}
              aria-pressed={selected}
              className={cx(
                'flex h-10 items-center justify-center rounded-lg text-sm transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800',
                selected && 'bg-red-600 font-bold text-white',
                !selected && bookable && 'cursor-pointer bg-blue-100 text-gray-800 hover:bg-blue-200',
                !bookable && 'cursor-not-allowed bg-gray-200 text-gray-400',
                isToday && !selected && 'border-2 border-red-600',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Tours run Monday to Friday, up to {daysAhead} days ahead.
      </p>
    </div>
  );
}

export default DatePicker;
