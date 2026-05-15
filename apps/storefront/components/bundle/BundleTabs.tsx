"use client";

import { useState } from "react";
import type { Bundle } from "@wsp/types";
import { BundleCard } from "./BundleCard";

interface BundleTabsProps {
  bundles: Bundle[];
  locale?: string;
}

/** Gruppiert Bundles nach tab_group. Bundles ohne tab_group bilden eigene Gruppen. */
function groupBundles(bundles: Bundle[]): Array<{
  key: string;
  label: string;
  bundles: Bundle[];
}> {
  const grouped = new Map<string, Bundle[]>();

  for (const bundle of bundles) {
    const groupKey = bundle.tab_group ?? `_single_${bundle.id}`;
    const existing = grouped.get(groupKey);
    if (existing) {
      existing.push(bundle);
    } else {
      grouped.set(groupKey, [bundle]);
    }
  }

  return Array.from(grouped.entries()).map(([key, items]) => {
    const label = items[0].tab_name ?? items[0].title;
    return { key, label, bundles: items };
  });
}

export function BundleTabs({ bundles, locale = "de" }: BundleTabsProps) {
  const groups = groupBundles(bundles);
  const [activeTab, setActiveTab] = useState(0);

  if (groups.length === 0) return null;

  // Einzelnes Bundle ohne Tabs direkt zeigen
  if (groups.length === 1 && groups[0].bundles.length === 1) {
    return (
      <div>
        <BundleCard bundle={groups[0].bundles[0]} locale={locale} />
      </div>
    );
  }

  return (
    <div>
      {/* Tab-Navigation */}
      <div
        role="tablist"
        aria-label="Bundle-Kategorien"
        className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none"
      >
        {groups.map((group, idx) => (
          <button
            key={group.key}
            role="tab"
            aria-selected={activeTab === idx}
            aria-controls={`bundle-panel-${idx}`}
            id={`bundle-tab-${idx}`}
            onClick={() => setActiveTab(idx)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === idx
                ? "bg-brand-dark text-white"
                : "bg-gray-100 text-brand-muted hover:bg-gray-200 hover:text-brand-dark"
            }`}
          >
            {group.label}
            {group.bundles.length > 1 && (
              <span className="ml-1.5 text-xs opacity-70">({group.bundles.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab-Content */}
      {groups.map((group, idx) => (
        <div
          key={group.key}
          role="tabpanel"
          id={`bundle-panel-${idx}`}
          aria-labelledby={`bundle-tab-${idx}`}
          hidden={activeTab !== idx}
          className="space-y-4"
        >
          {group.bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} locale={locale} />
          ))}
        </div>
      ))}
    </div>
  );
}
