"use server";

import { z } from "zod";

const Schema = z.object({
  order_reference:      z.string().min(1).max(100),
  customer_first_name:  z.string().min(1).max(100),
  customer_last_name:   z.string().min(1).max(100),
  customer_email:       z.string().email().max(254),
  message:              z.string().max(5000).optional(),
  website:              z.string().max(0, "").optional(), // Honeypot
  locale:               z.enum(["de", "en", "es"]).default("de"),
});

export type CancellationFormState = {
  status: "idle" | "success" | "error";
  code?: "rate_limited" | "feature_disabled" | "generic";
};

export async function submitCancellationRequest(
  data: z.infer<typeof Schema>
): Promise<CancellationFormState> {
  const parsed = Schema.safeParse(data);
  if (!parsed.success) {
    return { status: "error", code: "generic" };
  }

  const d = parsed.data;

  // Honeypot
  if (d.website && d.website.length > 0) {
    return { status: "success" };
  }

  const commerceUrl = (process.env.COMMERCE_API_URL ?? "http://localhost:3001")
    .trim()
    .replace(/\/$/, "");

  try {
    const res = await fetch(`${commerceUrl}/api/cancellations/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_reference:      d.order_reference.trim(),
        customer_first_name:  d.customer_first_name.trim(),
        customer_last_name:   d.customer_last_name.trim(),
        customer_email:       d.customer_email.trim().toLowerCase(),
        message:              d.message?.trim() || undefined,
        locale:               d.locale,
      }),
    });

    if (res.status === 429) return { status: "error", code: "rate_limited" };
    if (res.status === 503) return { status: "error", code: "feature_disabled" };
    if (!res.ok && res.status !== 201) return { status: "error", code: "generic" };

    return { status: "success" };
  } catch (err) {
    console.error("[submitCancellationRequest]", err);
    return { status: "error", code: "generic" };
  }
}
