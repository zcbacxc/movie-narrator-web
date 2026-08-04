import { Settings, Search, ShieldAlert, Scissors, Languages, Repeat, type LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useI18n } from "@/i18n"
import type { FormSubmitData } from "@/types"

interface AdvancedSectionProps {
  data: FormSubmitData
  onChange: (field: keyof FormSubmitData, value: string | number | boolean | undefined) => void
}

function SwitchRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: LucideIcon
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
        <div>
          <Label className="cursor-pointer">{label}</Label>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function AdvancedSection({ data, onChange }: AdvancedSectionProps) {
  const { t } = useI18n()
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced" className="border-b-0">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            {t("advanced.title")}
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-5">
          {/* Research */}
          <SwitchRow
            icon={Search}
            label={t("advanced.research")}
            description={t("advanced.research.desc")}
            checked={data.research}
            onCheckedChange={(v) => onChange("research", v)}
          />

          {/* Strict mode */}
          <SwitchRow
            icon={ShieldAlert}
            label={t("advanced.strict")}
            description={t("advanced.strict.desc")}
            checked={data.strict}
            onCheckedChange={(v) => onChange("strict", v)}
          />

          {/* No clips */}
          <SwitchRow
            icon={Scissors}
            label={t("advanced.noClips")}
            description={t("advanced.noClips.desc")}
            checked={data.no_clips}
            onCheckedChange={(v) => onChange("no_clips", v)}
          />

          {/* Numeric params */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("advanced.sceneThreshold")}</Label>
              <Input
                type="number"
                value={data.scene_threshold ?? ""}
                onChange={(e) =>
                  onChange("scene_threshold", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0 - 100"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("advanced.matchMinScore")}</Label>
              <Input
                type="number"
                step="0.1"
                value={data.match_min_score ?? ""}
                onChange={(e) =>
                  onChange("match_min_score", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0.0 - 1.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <Languages className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("advanced.translateProvider")}
            </Label>
            <Input
              value={data.translate_provider}
              onChange={(e) => onChange("translate_provider", e.target.value)}
              placeholder={t("advanced.translateProvider.placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <Repeat className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("advanced.translateRetries")}
            </Label>
            <Input
              type="number"
              value={data.translate_retries ?? ""}
              onChange={(e) =>
                onChange("translate_retries", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0 - 10"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
