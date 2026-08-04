import { useRef, useState } from "react"
import { FolderOpen, Upload, Music, Music2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n"
import type { FormSubmitData } from "@/types"

interface AssetsSectionProps {
  data: FormSubmitData
  videoFile: File | null
  bgmFile: File | null
  onChange: (field: keyof FormSubmitData, value: string | number | boolean) => void
  onVideoChange: (file: File | null) => void
  onBgmChange: (file: File | null) => void
}

function FileDrop({
  file,
  accept,
  placeholder,
  onFileChange,
}: {
  file: File | null
  accept: string
  placeholder: string
  onFileChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) onFileChange(f)
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-input border border-dashed px-4 py-3 transition-colors",
        dragOver
          ? "border-pink-500 bg-pink-500/5"
          : "border-border bg-surface hover:border-slate-500"
      )}
    >
      <Upload className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} />
      <span className="flex-1 truncate text-sm">
        {file ? file.name : <span className="text-slate-400">{placeholder}</span>}
      </span>
      {file && (
        <span className="text-xs text-slate-400">
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          onFileChange(f)
        }}
      />
    </div>
  )
}

export function AssetsSection({
  data,
  videoFile,
  bgmFile,
  onChange,
  onVideoChange,
  onBgmChange,
}: AssetsSectionProps) {
  const { t } = useI18n()
  return (
    <Accordion type="single" collapsible defaultValue="assets">
      <AccordionItem value="assets" className="border-b-0">
        <AccordionTrigger>{t("assets.title")}</AccordionTrigger>
        <AccordionContent className="space-y-5">
          {/* Video upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <FolderOpen className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("assets.video")}
            </Label>
            <FileDrop
              file={videoFile}
              accept="video/*"
              placeholder={t("assets.video.placeholder")}
              onFileChange={onVideoChange}
            />
            <p className="text-xs text-slate-400">
              {t("assets.video.hint")}
            </p>
          </div>

          {/* Library directory */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <FolderOpen className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("assets.libraryDir")}
            </Label>
            <Input
              value={data.library_dir}
              onChange={(e) => onChange("library_dir", e.target.value)}
              placeholder={t("assets.libraryDir.placeholder")}
            />
          </div>

          {/* BGM upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-slate-200">
              <Music className="h-4 w-4 text-pink-500" strokeWidth={1.5} />
              {t("assets.bgm")}
            </Label>
            <FileDrop
              file={bgmFile}
              accept="audio/*"
              placeholder={t("assets.bgm.placeholder")}
              onFileChange={onBgmChange}
            />
          </div>

          {/* No BGM switch */}
          <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
              <div>
                <Label className="cursor-pointer">{t("assets.noBgm")}</Label>
                <p className="text-xs text-slate-400">{t("assets.noBgm.desc")}</p>
              </div>
            </div>
            <Switch
              checked={data.no_bgm}
              onCheckedChange={(v) => onChange("no_bgm", v)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
