import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("not_found");

  return (
    <main className="flex-1 flex items-center justify-center py-24 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-brand-accent mb-4">404</p>
        <h1 className="text-2xl font-semibold text-brand-text mb-3">
          {t("title")}
        </h1>
        <p className="text-brand-muted mb-8">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-accent hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
        >
          {t("cta")}
        </Link>
      </div>
    </main>
  );
}
