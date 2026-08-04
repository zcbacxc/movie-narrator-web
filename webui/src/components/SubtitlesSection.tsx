import { Captions, Languages } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useI18n } from "@/i18n"
import type { FormSubmitData } from "@/types"

interface SubtitlesSectionProps {
  data: FormSubmitData
  onChange: (field: keyof FormSubmitData, value: string | number | boolean) => void
}

export function SubtitlesSection({ data, onChange }: SubtitlesSectionProps) {
  const { t } = useI18n()
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="subtitles" className="border-b-0">
        <AccordionTrigger>{t("subtitles.title")}</AccordionTrigger>
        <AccordionContent className="space-y-5">
          {/* Subtitle language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <Languages className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("subtitles.lang")}
            </Label>
            <Input
              value={data.subtitle_lang}
              onChange={(e) => onChange("subtitle_lang", e.target.value)}
              placeholder={t("subtitles.lang.placeholder")}
            />
            <p className="text-xs text-slate-400">
              {t("subtitles.lang.hint")}
            </p>
          </div>

          {/* Subtitle mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <Captions className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("subtitles.mode")}
            </Label>
            <div className="flex gap-2">
              {([
                { value: "original", key: "subtitles.mode.original" },
                { value: "translated", key: "subtitles.mode.translated" },
                { value: "bilingual", key: "subtitles.mode.bilingual" },
              ] as const).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onChange("subtitle_mode", mode.value)}
                  className={`flex-1 rounded-input border px-3 py-2 text-sm font-medium transition-colors ${
                    data.subtitle_mode === mode.value
                      ? "border-pink-500 bg-pink-500/10 text-pink-400"
                      : "border-border bg-surface text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {t(mode.key)}
                </button>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
