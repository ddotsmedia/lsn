'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: ModalSize;
  className?: string;
  /** Set false to require the close button / ESC instead of an overlay click. */
  closeOnOverlayClick?: boolean;
  /** Accessible name when no visible `title` is rendered. */
  ariaLabel?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className,
  closeOnOverlayClick = true,
  ariaLabel,
}: ModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Portals need the DOM, which does not exist during the server render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Consumers usually pass an inline arrow for `onClose`, which changes identity
  // on every render. Reading it through a ref keeps `handleClose` stable so the
  // effect below runs only when `isOpen` flips — otherwise a parent re-render
  // while the modal is open would re-run it and steal focus back to the close
  // button mid-interaction.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Prevent the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog, then restore it to the trigger on close.
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen, handleClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 animate-fade-in sm:items-center sm:p-4"
      onClick={closeOnOverlayClick ? handleClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        // Clicks inside the panel must not bubble up to the overlay's close handler.
        onClick={(event) => event.stopPropagation()}
        className={cx(
          'relative w-full rounded-t-lg bg-white shadow-lg sm:rounded-lg',
          'max-h-[90dvh] overflow-y-auto animate-fade-in',
          SIZE_CLASSES[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 p-4 md:p-6">
          {title ? (
            <h2 id={titleId} className="text-xl font-semibold text-gray-800 md:text-2xl">
              {title}
            </h2>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-800 transition-colors duration-200 ease-in-out hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-6 md:px-6 md:pb-8">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
