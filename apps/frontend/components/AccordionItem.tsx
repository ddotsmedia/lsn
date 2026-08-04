'use client';

import React from 'react';

export interface AccordionItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  /** Stable id used to wire the button to its panel for assistive tech. */
  id: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * A single FAQ row.
 *
 * The open/close animation uses the grid-template-rows 0fr -> 1fr technique
 * rather than max-height: it animates to the content's natural height, so long
 * answers never get clipped and short ones do not sit behind dead space.
 */
export function AccordionItem({
  question,
  answer,
  isExpanded,
  onToggle,
  id,
  className,
}: AccordionItemProps) {
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <div className={cx('border-b border-gray-200', className)}>
      <h3>
        <button
          type="button"
          id={buttonId}
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left transition-colors duration-200 ease-in-out hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
        >
          <span className="text-base font-semibold text-gray-800 md:text-lg">{question}</span>
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cx(
              'shrink-0 text-red-600 transition-transform duration-300 ease-in-out',
              isExpanded && 'rotate-180',
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        // A 0fr grid row still leaves the answer in the accessibility tree, so
        // collapsed panels are marked inert to keep them out of it.
        inert={!isExpanded}
        className={cx(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-base leading-relaxed text-gray-700">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default AccordionItem;
