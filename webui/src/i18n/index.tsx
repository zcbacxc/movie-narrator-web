import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { messages, type Language, type MessageKey } from "./messages"

const STORAGE_KEY = "movie-narrator.ui.lang"

function detectInitialLanguage(): Language {
  // 1. Persisted user choice wins.
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "zh" || saved === "en") return saved
  } catch {
    // localStorage unavailable (e.g. private mode) — fall through.
  }
  // 2. Otherwise follow the browser language, defaulting to Chinese.
  const nav = (navigator.language || navigator.languages?.[0] || "").toLowerCase()
  return nav.startsWith("zh") ? "zh" : "en"
}

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore write failures
    }
  }, [lang])

  const t = useCallback<I18nContextValue["t"]>(
    (key, params) => {
      let str: string = messages[lang][key]
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.split(`{${k}}`).join(String(v))
        }
      }
      return str
    },
    [lang],
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      t,
    }),
    [lang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return ctx
}