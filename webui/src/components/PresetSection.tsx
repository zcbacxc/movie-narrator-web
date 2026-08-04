import { Wand2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { NARRATION_PRESETS } from "@/types"
import { useI18n } from "@/i18n"
import type { MessageKey } from "@/i18n/messages"
import type { FormSubmitData } from "@/types"

interface PresetSectionProps {
  data: FormSubmitData
  onChange: (field: keyof FormSubmitData, value: string | number | boolean) => void
}

// Map preset value -> i18n key (label + description)
const PRESET_KEYS: Record<string, { label: MessageKey; desc: MessageKey }> = {
  "douyin-fast": { label: "preset.douyin-fast", desc: "preset.douyin-fast.desc" },
  "mainstream-dry": { label: "preset.mainstream-dry", desc: "preset.mainstream-dry.desc" },
  "bilibili-long": { label: "preset.bilibili-long", desc: "preset.bilibili-long.desc" },
}

export function PresetSection({ data, onChange }: PresetSectionProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-slate-200">
        <Wand2 className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
        {t("preset.title")}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {NARRATION_PRESETS.map((preset) => {
          const keys = PRESET_KEYS[preset.value] ?? { label: preset.label, desc: preset.description }
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange("narration_preset", preset.value)}
              className={`flex flex-col items-start gap-0.5 rounded-input border px-3 py-2.5 text-left text-sm transition-colors ${
                data.narration_preset === preset.value
                  ? "border-pink-500 bg-pink-500/10 text-pink-400"
                  : "border-border bg-surface text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              <span className="font-medium">{t(keys.label)}</span>
              <span className="text-xs text-slate-400">{t(keys.desc)}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-400">
        {t("preset.hint")}
      </p>
    </div>
  )
}