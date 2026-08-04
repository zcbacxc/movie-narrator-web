import { Film, Languages } from "lucide-react"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

export function Header() {
  const { lang, setLang, t } = useI18n()

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
          <Film className="h-5 w-5 text-pink-500" strokeWidth={1.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-slate-50">{t("header.title")}</h1>
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-slate-400">
            v0.1.0
          </span>
        </div>
      </div>

      {/* Language switcher */}
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {(["zh", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                lang === code
                  ? "bg-pink-500/15 text-pink-400"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              {code === "zh" ? "中文" : "EN"}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}