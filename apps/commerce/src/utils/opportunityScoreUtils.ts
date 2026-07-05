// Kombinierter Opportunity Score: DealScore 50% + Knowledge 30% + Pricing 20%

export function computePricingScore(price_cents: number | null, price_negotiable: boolean): number {
  if (!price_cents) return 0;
  return price_negotiable ? 50 : 100;
}

export function computeOpportunityScore(
  dealScore: number | null,
  dataCompletenessScore: number | null,
  price_cents: number | null,
  price_negotiable: boolean,
): number {
  const ds = dealScore ?? 0;
  const ks = dataCompletenessScore ?? 0;
  const ps = computePricingScore(price_cents, price_negotiable);
  return Math.round(ds * 0.5 + ks * 0.3 + ps * 0.2);
}
