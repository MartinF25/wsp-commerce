"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitWaitlist, type WaitlistFormState } from "@/app/[locale]/products/waitlist-actions";
import { Link } from "@/i18n/navigation";

type Props = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string;
  variantSku?: string;
  locale: string;
  sourcePath: string;
};

const initialState: WaitlistFormState = { status: "idle" };

export function WaitlistForm({
  productId,
  productSlug,
  productName,
  variantId,
  variantSku,
  locale,
  sourcePath,
}: Props) {
  const t = useTranslations("product");
  const [state, formAction, isPending] = useActionState(submitWaitlist, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-sm font-medium text-emerald-800">{t("waitlist_success")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-5">
      <p className="text-sm font-semibold text-brand-text mb-4">{t("notify_cta")}</p>

      <form action={formAction} className="space-y-3">
        {/* Hidden fields */}
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="productSlug" value={productSlug} />
        <input type="hidden" name="productName" value={productName} />
        {variantId && <input type="hidden" name="variantId" value={variantId} />}
        {variantSku && <input type="hidden" name="variantSku" value={variantSku} />}
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="sourcePath" value={sourcePath} />
        <input type="hidden" name="consentAccepted" value="true" />

        {/* Honeypot */}
        <input type="text" name="website" className="hidden" tabIndex={-1} aria-hidden="true" />

        {/* E-Mail */}
        <div>
          <label htmlFor="waitlist-email" className="block text-xs font-medium text-brand-muted mb-1">
            {t("waitlist_email")} *
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-text placeholder:text-gray-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            placeholder="ihre@email.de"
          />
        </div>

        {/* Vorname optional */}
        <div>
          <label htmlFor="waitlist-firstname" className="block text-xs font-medium text-brand-muted mb-1">
            {t("waitlist_firstname")}
          </label>
          <input
            id="waitlist-firstname"
            name="firstName"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-text placeholder:text-gray-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
          />
        </div>

        {/* Einwilligung */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="consentCheckbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
          />
          <span className="text-xs text-brand-muted leading-snug">
            {t("waitlist_consent")}{" "}
            <Link href="/datenschutz" className="underline hover:text-brand-accent">
              {t("waitlist_privacy")}
            </Link>
          </span>
        </label>

        {/* Fehler */}
        {(state.status === "error" || state.status === "duplicate") && (
          <p className="text-xs text-red-600">
            {state.status === "duplicate" ? t("waitlist_already") : (state.message ?? t("waitlist_error"))}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60 transition-colors duration-150"
        >
          {isPending ? "…" : t("waitlist_submit")}
        </button>
      </form>
    </div>
  );
}
