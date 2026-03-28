"use client";

import { EmptyStateCard } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/lib/i18n/context";

export function CatalogEmptyState() {
  const { t } = useI18n();
  return (
    <EmptyStateCard
      title={t("catalog_noResultsTitle")}
      description={t("catalog_noResultsDesc")}
    />
  );
}
