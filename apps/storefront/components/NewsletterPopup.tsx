"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useNewsletterPopup } from "@/hooks/useNewsletterPopup";
import {
  subscribeNewsletter,
  type NewsletterFormState,
} from "@/actions/newsletter";

const initialState: NewsletterFormState = { status: "idle" };

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-shadow duration-150";

export function NewsletterPopup() {
  const t = useTranslations("newsletter");
  const { isOpen, dismiss, markSubscribed } = useNewsletterPopup();
  const [state, formAction] = useFormState(subscribeNewsletter, initialState);

  if (!isOpen) return null;

  if (state.status === "success") {
    return (
      <PopupShell onClose={markSubscribed} label={t("close")}>
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-brand-accent text-xl mb-3">
            ✓
          </div>
          <p className="text-sm font-semibold text-brand-text mb-1">
            {t("success_title")}
          </p>
          <p className="text-xs text-brand-muted leading-relaxed">
            {t("success_text")}
          </p>
        </div>
      </PopupShell>
    );
  }

  return (
    <PopupShell onClose={dismiss} label={t("close")}>
      <p className="text-sm font-bold text-brand-text mb-0.5 pr-5">
        {t("title")}
      </p>
      <p className="text-xs text-brand-muted leading-relaxed mb-4">
        {t("subtitle")}
      </p>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-xs text-red-600 mb-3">
          {state.message}
        </p>
      )}

      <form action={formAction} className="space-y-2.5" noValidate>
        {/* Honeypot – muss leer sein */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
          tabIndex={-1}
        >
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <input
          name="firstName"
          type="text"
          autoComplete="given-name"
          placeholder={t("firstname_placeholder")}
          className={INPUT_CLASS}
        />

        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("email_placeholder")}
          className={INPUT_CLASS}
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            name="consentGiven"
            type="checkbox"
            value="true"
            required
            className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded border-gray-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
          />
          <span className="text-[10px] text-brand-muted leading-relaxed">
            {t.rich("consent", {
              link: (chunks) => (
                <Link
                  href="/datenschutz"
                  className="underline hover:text-brand-text"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        <SubmitButton label={t("cta")} pendingLabel={t("sending")} />
      </form>
    </PopupShell>
  );
}

function PopupShell({
  onClose,
  label,
  children,
}: {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter"
      className="fixed bottom-6 right-6 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors duration-150"
        aria-label={label}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      {children}
    </div>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-accent text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
