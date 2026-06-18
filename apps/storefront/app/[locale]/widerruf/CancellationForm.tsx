"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitCancellationRequest } from "./actions";

export function CancellationForm({ datenschutzHref }: { datenschutzHref: string }) {
  const t      = useTranslations("widerruf");
  const locale = useLocale() as "de" | "en" | "es";

  const [status, setStatus]   = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [fields, setFields] = useState({
    order_reference:     "",
    customer_first_name: "",
    customer_last_name:  "",
    customer_email:      "",
    message:             "",
    website:             "", // honeypot – hidden
    privacy:             false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof fields, string>>>({});

  function validate() {
    const next: typeof errors = {};
    if (!fields.order_reference.trim())     next.order_reference     = t("error_order_reference_required");
    if (!fields.customer_first_name.trim()) next.customer_first_name = t("error_first_name_required");
    if (!fields.customer_last_name.trim())  next.customer_last_name  = t("error_last_name_required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.customer_email)) next.customer_email = t("error_email_invalid");
    if (!fields.privacy)                    next.privacy             = t("error_privacy_required");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrorMsg("");

    const result = await submitCancellationRequest({
      order_reference:     fields.order_reference,
      customer_first_name: fields.customer_first_name,
      customer_last_name:  fields.customer_last_name,
      customer_email:      fields.customer_email,
      message:             fields.message || undefined,
      website:             fields.website,
      locale,
    });

    if (result.status === "success") {
      setStatus("success");
    } else {
      const msg =
        result.code === "rate_limited"    ? t("error_rate_limited") :
        result.code === "feature_disabled" ? t("error_feature_disabled") :
        t("error_submit");
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-semibold text-brand-text mb-3">
          {t("success_title")}
        </h2>
        <p className="text-brand-muted leading-relaxed max-w-lg mx-auto">
          {t("success_message")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot – für Bots unsichtbar */}
      <input
        type="text"
        name="website"
        value={fields.website}
        onChange={(e) => setFields((f) => ({ ...f, website: e.target.value }))}
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        autoComplete="off"
      />

      {/* Bestellnummer */}
      <Field label={t("order_reference")} required error={errors.order_reference}>
        <input
          type="text"
          value={fields.order_reference}
          onChange={(e) => setFields((f) => ({ ...f, order_reference: e.target.value }))}
          placeholder={t("order_reference_placeholder")}
          disabled={status === "submitting"}
          className={inputClass(!!errors.order_reference)}
        />
      </Field>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("first_name")} required error={errors.customer_first_name}>
          <input
            type="text"
            autoComplete="given-name"
            value={fields.customer_first_name}
            onChange={(e) => setFields((f) => ({ ...f, customer_first_name: e.target.value }))}
            disabled={status === "submitting"}
            className={inputClass(!!errors.customer_first_name)}
          />
        </Field>
        <Field label={t("last_name")} required error={errors.customer_last_name}>
          <input
            type="text"
            autoComplete="family-name"
            value={fields.customer_last_name}
            onChange={(e) => setFields((f) => ({ ...f, customer_last_name: e.target.value }))}
            disabled={status === "submitting"}
            className={inputClass(!!errors.customer_last_name)}
          />
        </Field>
      </div>

      {/* E-Mail */}
      <Field label={t("email")} required error={errors.customer_email}>
        <input
          type="email"
          autoComplete="email"
          value={fields.customer_email}
          onChange={(e) => setFields((f) => ({ ...f, customer_email: e.target.value }))}
          disabled={status === "submitting"}
          className={inputClass(!!errors.customer_email)}
        />
      </Field>

      {/* Nachricht */}
      <Field label={t("message")}>
        <textarea
          rows={4}
          value={fields.message}
          onChange={(e) => setFields((f) => ({ ...f, message: e.target.value }))}
          placeholder={t("message_placeholder")}
          disabled={status === "submitting"}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-brand-text placeholder-gray-400 outline-none focus:border-brand-accent transition-colors resize-y"
        />
      </Field>

      {/* Datenschutz */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={fields.privacy}
            onChange={(e) => setFields((f) => ({ ...f, privacy: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
            disabled={status === "submitting"}
          />
          <span className="text-sm text-brand-muted leading-snug">
            {t.rich("privacy_consent", {
              link: (chunks) => (
                <Link href={datenschutzHref} className="text-brand-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.privacy && <p className="mt-1.5 text-xs text-red-500">{errors.privacy}</p>}
      </div>

      {/* Fehlermeldung */}
      {status === "error" && errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex items-center gap-2 px-8 py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {status === "submitting" ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-2.5 border rounded-lg text-sm text-brand-text placeholder-gray-400 outline-none transition-colors ${
    hasError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-brand-accent"
  }`;
}

function Field({
  label, required, error, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-text mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
