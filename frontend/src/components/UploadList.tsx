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
  const active = tasks.filter((t) => t.status === "uploading").length
  return (
    <div className="absolute bottom-5 right-5 z-20 w-[22rem] bg-[color:var(--card)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45),0_2px_0_0_var(--rule)] border border-[color:var(--rule)]/50 overflow-hidden font-mono">
      <div className="relative px-3 py-2 flex items-center justify-between border-b border-dashed border-[color:var(--rule)]/50 bg-[color:var(--accent)]/40">
        <div className="flex items-center gap-2">
          <span className="stamp text-[color:var(--oxblood)] text-[0.55rem] py-[1px] px-1.5">
            ★ Deposit ★
          </span>
          <span className="smallcaps text-[0.6rem] text-muted-foreground tracking-[0.18em]">
            {active === 0
              ? "ledger"
              : `${active.toString().padStart(2, "0")} in transit`}
          </span>
        </div>
        <span className="tabular text-[0.6rem] text-muted-foreground">
          № {tasks.length.toString().padStart(3, "0")}
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="px-3 py-2.5 text-sm border-b border-dashed border-[color:var(--border)]/60 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              {task.status === "uploading" && (
                <FileUp className="h-3.5 w-3.5 text-[color:var(--ochre)] shrink-0" />
              )}
              {task.status === "done" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--teal-faded)] shrink-0" />
              )}
              {task.status === "error" && (
                <XCircle className="h-3.5 w-3.5 text-[color:var(--oxblood)] shrink-0" />
              )}
              <span className="truncate flex-1 font-serif text-[13px] tracking-tight">
                {task.name}
              </span>
              {task.status === "uploading" && (
                <span className="tabular text-[0.65rem] text-muted-foreground">
                  {Math.round(task.progress).toString().padStart(2, "0")}%
                </span>
              )}
              <button
                type="button"
                onClick={() => onDismiss(task.id)}
                className="text-[0.65rem] text-muted-foreground hover:text-foreground transition-colors px-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            {task.status === "uploading" && (
              <Progress
                value={task.progress}
                className="mt-2 h-[3px] bg-[color:var(--accent)]/70 [&>div]:bg-[color:var(--ochre)]"
              />
            )}
            {task.status === "done" && (
              <div className="mt-1.5 smallcaps text-[0.58rem] text-[color:var(--teal-faded)] tracking-[0.22em]">
                ✓ accessioned
              </div>
            )}
            {task.status === "error" && task.error && (
              <p className="text-[0.7rem] text-[color:var(--oxblood)] mt-1 font-serif italic">
                {task.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
