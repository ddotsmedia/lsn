'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';

export interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  newsletter: boolean;
}

/** Only the validated fields can carry an error. */
type ValidatedField = 'name' | 'email' | 'subject' | 'message';
type FormErrors = Partial<Record<ValidatedField, string>>;

const SUBJECT_OPTIONS: readonly string[] = [
  'General Inquiry',
  'Tour Request',
  'Registration Help',
  'Feedback',
  'Other',
];

const EMPTY_FORM: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  newsletter: false,
};

const SUCCESS_TIMEOUT_MS = 5000;

/** Deliberately permissive: something@something.tld, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

const INPUT_CLASSES =
  'w-full rounded-lg border-2 border-gray-300 bg-white p-3 text-base text-gray-800 ' +
  'transition-all duration-200 ease-in-out placeholder:text-gray-400 ' +
  'focus:border-red-600 focus:shadow-md focus:outline-none';

const INPUT_ERROR_CLASSES = 'border-red-600';

const LABEL_CLASSES = 'mb-2 block text-sm font-semibold text-gray-700';

function validate(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  const name = data.name.trim();
  if (!name) {
    errors.name = 'Please enter your name.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  const email = data.email.trim();
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.subject) {
    errors.subject = 'Please choose a subject.';
  }

  const message = data.message.trim();
  if (!message) {
    errors.message = 'Please enter a message.';
  } else if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }

  return errors;
}

export function ContactForm({ onSuccess, className }: ContactFormProps) {
  const fieldId = useId();
  const [data, setData] = useState<ContactFormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<ReadonlySet<ValidatedField>>(() => new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const errors = validate(data);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const dismissSuccess = (): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSubmitted(false);
  };

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K],
  ): void => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: ValidatedField): void => {
    setTouched((current) => {
      if (current.has(field)) return current;
      const next = new Set(current);
      next.add(field);
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isValid) {
      setTouched(new Set<ValidatedField>(['name', 'email', 'subject', 'message']));
      return;
    }

    // No backend endpoint exists for contact messages yet, so this only
    // confirms to the sender. Nothing is transmitted or stored.
    setData(EMPTY_FORM);
    setTouched(new Set());
    setIsSubmitted(true);
    onSuccess?.();

    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsSubmitted(false);
      timeoutRef.current = null;
    }, SUCCESS_TIMEOUT_MS);
  };

  /** Errors surface only once a field has been visited or submit attempted. */
  const errorFor = (field: ValidatedField): string | undefined =>
    touched.has(field) ? errors[field] : undefined;

  const describedBy = (field: ValidatedField): string | undefined =>
    errorFor(field) ? `${fieldId}-${field}-error` : undefined;

  return (
    <div className={className}>
      <h2 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">Send us a Message</h2>

      {isSubmitted && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-green-400 bg-green-50 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-green-800">Message Sent Successfully!</p>
              <p className="mt-1 text-sm text-green-700">
                Thank you! We&rsquo;ll be in touch soon.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissSuccess}
              aria-label="Dismiss confirmation"
              className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-green-800 transition-colors duration-200 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <svg
                width={18}
                height={18}
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
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="mb-4 md:mb-6">
          <label htmlFor={`${fieldId}-name`} className={LABEL_CLASSES}>
            Name <span className="text-red-600">*</span>
          </label>
          <input
            id={`${fieldId}-name`}
            name="name"
            type="text"
            value={data.name}
            onChange={(event) => updateField('name', event.target.value)}
            onBlur={() => markTouched('name')}
            required
            aria-required="true"
            aria-invalid={errorFor('name') ? true : undefined}
            aria-describedby={describedBy('name')}
            className={cx(INPUT_CLASSES, errorFor('name') && INPUT_ERROR_CLASSES)}
          />
          {errorFor('name') && (
            <p id={`${fieldId}-name-error`} className="mt-1 text-xs text-red-600">
              {errorFor('name')}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4 md:mb-6">
          <label htmlFor={`${fieldId}-email`} className={LABEL_CLASSES}>
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(event) => updateField('email', event.target.value)}
            onBlur={() => markTouched('email')}
            required
            aria-required="true"
            aria-invalid={errorFor('email') ? true : undefined}
            aria-describedby={describedBy('email')}
            className={cx(INPUT_CLASSES, errorFor('email') && INPUT_ERROR_CLASSES)}
          />
          {errorFor('email') && (
            <p id={`${fieldId}-email-error`} className="mt-1 text-xs text-red-600">
              {errorFor('email')}
            </p>
          )}
        </div>

        {/* Phone (optional) */}
        <div className="mb-4 md:mb-6">
          <label htmlFor={`${fieldId}-phone`} className={LABEL_CLASSES}>
            Phone <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id={`${fieldId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        {/* Subject */}
        <div className="mb-4 md:mb-6">
          <label htmlFor={`${fieldId}-subject`} className={LABEL_CLASSES}>
            Subject <span className="text-red-600">*</span>
          </label>
          <select
            id={`${fieldId}-subject`}
            name="subject"
            value={data.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            onBlur={() => markTouched('subject')}
            required
            aria-required="true"
            aria-invalid={errorFor('subject') ? true : undefined}
            aria-describedby={describedBy('subject')}
            className={cx(INPUT_CLASSES, errorFor('subject') && INPUT_ERROR_CLASSES)}
          >
            <option value="">Please choose…</option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errorFor('subject') && (
            <p id={`${fieldId}-subject-error`} className="mt-1 text-xs text-red-600">
              {errorFor('subject')}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="mb-4 md:mb-6">
          <label htmlFor={`${fieldId}-message`} className={LABEL_CLASSES}>
            Message <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`${fieldId}-message`}
            name="message"
            rows={5}
            value={data.message}
            onChange={(event) => updateField('message', event.target.value)}
            onBlur={() => markTouched('message')}
            required
            aria-required="true"
            aria-invalid={errorFor('message') ? true : undefined}
            aria-describedby={describedBy('message')}
            className={cx(INPUT_CLASSES, 'resize-y', errorFor('message') && INPUT_ERROR_CLASSES)}
          />
          {errorFor('message') && (
            <p id={`${fieldId}-message-error`} className="mt-1 text-xs text-red-600">
              {errorFor('message')}
            </p>
          )}
        </div>

        {/* Newsletter */}
        <div className="mb-6">
          <label htmlFor={`${fieldId}-newsletter`} className="flex items-start gap-3">
            <input
              id={`${fieldId}-newsletter`}
              name="newsletter"
              type="checkbox"
              checked={data.newsletter}
              onChange={(event) => updateField('newsletter', event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-gray-300 text-red-600 focus:ring-2 focus:ring-red-600"
            />
            <span className="text-sm text-gray-700">Subscribe to newsletter</span>
          </label>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={!isValid} fullWidth>
          Send Message
        </Button>
      </form>
    </div>
  );
}

export default ContactForm;
