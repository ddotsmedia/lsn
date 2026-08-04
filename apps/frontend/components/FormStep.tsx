'use client';

import React from 'react';

export interface FormStepProps {
  stepNumber: number;
  currentStep: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Wrapper for one step of the form. Inactive steps are unmounted rather than
 * hidden with CSS, so their controls cannot be reached by tabbing and are not
 * submitted or announced while another step is on screen.
 */
export function FormStep({
  stepNumber,
  currentStep,
  title,
  subtitle,
  children,
  className,
}: FormStepProps) {
  if (stepNumber !== currentStep) return null;

  return (
    <section aria-labelledby={`step-${stepNumber}-heading`} className={cx('w-full', className)}>
      <h2
        id={`step-${stepNumber}-heading`}
        className="text-2xl font-bold text-gray-800 md:text-3xl"
      >
        {title}
      </h2>
      {subtitle && <p className="mt-2 mb-8 text-base text-gray-600">{subtitle}</p>}

      {children}
    </section>
  );
}

export default FormStep;
