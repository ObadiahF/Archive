import { CheckCircle2, FileUp, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export interface UploadTask {
  id: string
  name: string
  progress: number
  status: "uploading" | "done" | "error"
  error?: string
}

interface UploadListProps {
  tasks: UploadTask[]
  onDismiss: (id: string) => void
}

export function UploadList({ tasks, onDismiss }: UploadListProps) {
  if (tasks.length === 0) return null
  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 rounded-lg border bg-card shadow-lg overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        Uploads ({tasks.filter((t) => t.status === "uploading").length} active)
      </div>
      <div className="divide-y max-h-72 overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              {task.status === "uploading" && (
                <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {task.status === "done" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              {task.status === "error" && (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span className="truncate flex-1">{task.name}</span>
              <button
                type="button"
                onClick={() => onDismiss(task.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            {task.status === "uploading" && (
              <Progress value={task.progress} className="mt-2 h-1" />
            )}
            {task.status === "error" && task.error && (
              <p className="text-xs text-destructive mt-1">{task.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
