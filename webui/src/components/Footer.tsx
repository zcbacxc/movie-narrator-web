import { useI18n } from "@/i18n"

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border px-6 py-3 text-center text-xs text-slate-400">
      Movie Narrator &copy; {new Date().getFullYear()} &middot; {t("footer.tagline")}
    </footer>
  )
}