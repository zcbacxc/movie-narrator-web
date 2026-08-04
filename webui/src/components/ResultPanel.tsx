import {
  CheckCircle2,
  XCircle,
  Ban,
  Download,
  PlusCircle,
  PlayCircle,
  FileArchive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTask } from "@/hooks/useTask"
import { useI18n } from "@/i18n"
import { getArtifactUrl, getVideoUrl } from "@/lib/api"

export function ResultPanel() {
  const { t } = useI18n()
  const { taskId, status, artifacts, error, resetTask } = useTask()

  if (!taskId) return null

  const artifactUrl = getArtifactUrl(taskId)
  const videoUrl = getVideoUrl(taskId)
  const hasArtifacts = artifacts && artifacts.length > 0

  // Done
  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-lg font-semibold">{t("result.done")}</span>
        </div>

        {/* Video player */}
        <div className="overflow-hidden rounded-card border border-border bg-black">
          <video
            controls
            className="mx-auto max-h-[480px] w-full"
            src={videoUrl}
          >
            {t("result.videoUnsupported")}
          </video>
        </div>

        {/* Artifacts download */}
        {hasArtifacts && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">{t("result.downloadArtifacts")}</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={artifactUrl} download>
                  <Download className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                  {t("result.downloadAll", { count: artifacts!.length })}
                </a>
              </Button>
              {artifacts!.map((path, idx) => (
                <Button key={idx} variant="ghost" size="sm" asChild>
                  <a href={artifactUrl} download>
                    <FileArchive className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                    {path.split(/[\\/]/).pop() || t("result.artifact", { count: idx + 1 })}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button variant="default" size="lg" className="w-full" onClick={resetTask}>
          <PlusCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {t("result.newTask")}
        </Button>
      </div>
    )
  }

  // Failed
  if (status === "failed") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-lg font-semibold">{t("result.failed")}</span>
        </div>

        {error && (
          <div className="rounded-card border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs leading-relaxed text-red-300">
              <span className="font-semibold">{t("result.error")}</span>
            </p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-300">
              {error}
            </pre>
          </div>
        )}

        {/* Partial artifacts */}
        {hasArtifacts && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">{t("result.partialArtifacts")}</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={artifactUrl} download>
                  <Download className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                  {t("result.download", { count: artifacts!.length })}
                </a>
              </Button>
            </div>
          </div>
        )}

        <Button variant="default" size="lg" className="w-full" onClick={resetTask}>
          <PlusCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {t("result.newTask")}
        </Button>
      </div>
    )
  }

  // Cancelled
  if (status === "cancelled") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Ban className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-lg font-semibold">{t("result.cancelled")}</span>
        </div>

        <p className="text-sm text-slate-400">
          {t("result.cancelled.desc")}
        </p>

        {/* Partial artifacts */}
        {hasArtifacts && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-200">{t("result.partialArtifacts")}</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={artifactUrl} download>
                  <Download className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                  {t("result.download", { count: artifacts!.length })}
                </a>
              </Button>
            </div>
          </div>
        )}

        <Button variant="default" size="lg" className="w-full" onClick={resetTask}>
          <PlusCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {t("result.newTask")}
        </Button>
      </div>
    )
  }

  // Running — show a placeholder (MonitorPanel handles the running state)
  return (
    <div className="flex items-center justify-center py-8 text-slate-400">
      <PlayCircle className="mr-2 h-5 w-5 animate-pulse" strokeWidth={1.5} />
      <span>{t("result.running")}</span>
    </div>
  )
}
