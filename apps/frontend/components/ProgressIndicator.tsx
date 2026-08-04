'use client';

import React from 'react';

export interface ProgressIndicatorProps {
  /** 1-based index of the step currently on screen. */
  currentStep: number;
  totalSteps: number;
  stepLabels: readonly string[];
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

function CheckIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Four-step progress rail. The visual circles and connectors are decorative —
 * the authoritative state for assistive tech is the "Step 2 of 4" line, which
 * is announced politely whenever the step changes.
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  className,
}: ProgressIndicatorProps) {
  const currentLabel = stepLabels[currentStep - 1] ?? '';

  return (
    <div className={cx('w-full', className)}>
      <p aria-live="polite" className="mb-4 text-center text-sm font-semibold text-gray-600">
        Step {currentStep} of {totalSteps}
        {currentLabel && <span className="text-gray-500"> — {currentLabel}</span>}
      </p>

      <ol className="flex items-start" aria-hidden="true">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = stepNumber === stepLabels.length;

          return (
            <li key={label} className={cx('flex flex-1 flex-col items-center', !isLast && 'relative')}>
              <div className="flex w-full items-center">
                {/* Left half connector — omitted on the first step */}
                <span
                  className={cx(
                    'h-1 flex-1 rounded-full',
                    index === 0 ? 'bg-transparent' : isComplete || isActive ? 'bg-red-600' : 'bg-gray-200',
                  )}
                />

                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                    'transition-all duration-200 ease-in-out md:h-10 md:w-10',
                    isComplete && 'border-green-600 bg-green-600 text-white',
                    isActive && 'border-red-600 bg-red-600 text-white',
                    !isComplete && !isActive && 'border-gray-300 bg-white text-gray-400',
                  )}
                >
                  {isComplete ? <CheckIcon /> : stepNumber}
                </span>

                {/* Right half connector — omitted on the last step */}
                <span
                  className={cx(
                    'h-1 flex-1 rounded-full',
                    isLast ? 'bg-transparent' : isComplete ? 'bg-red-600' : 'bg-gray-200',
                  )}
                />
              </div>

              <span
                className={cx(
                  'mt-2 px-1 text-center text-[11px] leading-tight md:text-sm',
                  isActive ? 'font-bold text-red-600' : isComplete ? 'font-medium text-green-700' : 'text-gray-400',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ProgressIndicator;
