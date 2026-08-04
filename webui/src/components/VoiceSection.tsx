import { Mic } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n"
import type { FormSubmitData } from "@/types"

interface VoiceSectionProps {
  data: FormSubmitData
  onChange: (field: keyof FormSubmitData, value: string | number | boolean) => void
}

export function VoiceSection({ data, onChange }: VoiceSectionProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-slate-200">
        <Mic className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
        {t("voice.name")}
      </Label>
      <Input
        value={data.voice}
        onChange={(e) => onChange("voice", e.target.value)}
        placeholder={t("voice.placeholder")}
      />
      <p className="text-xs text-slate-400">
        {t("voice.hint")}
      </p>
    </div>
  )
}
