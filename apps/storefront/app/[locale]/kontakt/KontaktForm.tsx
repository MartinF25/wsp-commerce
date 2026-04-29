"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { submitKontaktanfrage, type LeadFormState } from "./actions";

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-text placeholder-brand-muted bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-shadow duration-150";

const SELECT_CLASS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-shadow duration-150 appearance-none cursor-pointer";

const initialState: LeadFormState = { status: "idle" };

export function KontaktForm() {
  const t = useTranslations("kontakt");
  const [state, formAction] = useFormState(submitKontaktanfrage, initialState);

  const anfrageartOptions = t.raw("anfrageart_options") as string[];
  const projektartOptions = t.raw("projektart_options") as string[];

  if (state.status === "success") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-brand-accent text-2xl mb-5">
            ✓
          </div>
          <h2 className="font-display text-xl font-bold text-brand-text mb-3">{t("success_h2")}</h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-sm mx-auto">{t("success_text")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed"
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-6" noValidate>
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
          tabIndex={-1}
        >
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <legend className="sr-only">Name</legend>
          <FormField id="vorname" label={t("field_firstname")} required>
            <input
              id="vorname" name="vorname" type="text"
              autoComplete="given-name" required placeholder="Maria"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField id="nachname" label={t("field_lastname")} required>
            <input
              id="nachname" name="nachname" type="text"
              autoComplete="family-name" required placeholder="Muster"
              className={INPUT_CLASS}
            />
          </FormField>
        </fieldset>

        <FormField id="firma" label={t("field_company")}>
          <input
            id="firma" name="firma" type="text"
            autoComplete="organization" placeholder="Musterbau GmbH"
            className={INPUT_CLASS}
          />
        </FormField>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <legend className="sr-only">{t("field_email")}</legend>
          <FormField id="email" label={t("field_email")} required>
            <input
              id="email" name="email" type="email"
              autoComplete="email" required placeholder="maria.muster@beispiel.de"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField id="telefon" label={t("field_phone")}>
            <input
              id="telefon" name="telefon" type="tel"
              autoComplete="tel" placeholder="+49 89 12345678"
              className={INPUT_CLASS}
            />
          </FormField>
        </fieldset>

        <FormField id="anfrageart" label={t("field_type")} required hint={t("anfrageart_hint")}>
          <select id="anfrageart" name="anfrageart" required defaultValue="" className={SELECT_CLASS}>
            <option value="" disabled>{t("select_placeholder")}</option>
            {anfrageartOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FormField>

        <FormField id="projektart" label={t("field_project")} hint={t("projektart_hint")}>
          <select id="projektart" name="projektart" defaultValue="" className={SELECT_CLASS}>
            <option value="">{t("project_placeholder")}</option>
            {projektartOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FormField>

        <FormField id="nachricht" label={t("field_message")} required>
          <textarea
            id="nachricht" name="nachricht" required rows={5}
            placeholder={t("placeholder_message")}
            className={`${INPUT_CLASS} resize-y`}
          />
        </FormField>

        <div className="pt-2">
          <SubmitButton label={t("submit")} pendingLabel={t("sending")} />
          <p className="mt-3 text-xs text-brand-muted leading-relaxed">{t("consent_text")}</p>
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-brand-accent text-white font-semibold px-10 py-3.5 rounded-xl hover:bg-green-600 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormField({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-brand-text">
        {label}
        {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        {hint && !required && (
          <span className="ml-1.5 text-xs text-brand-muted font-normal">({hint})</span>
        )}
      </label>
      {children}
      {hint && required && <p className="text-xs text-brand-muted leading-relaxed">{hint}</p>}
    </div>
  );
}
