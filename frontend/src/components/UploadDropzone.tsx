interface UploadDropzoneProps {
  visible: boolean
}

export function UploadDropzone({ visible }: UploadDropzoneProps) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-[2px] pointer-events-none">
      <div className="absolute inset-6 border-2 border-dashed border-[color:var(--ochre)]/70 rounded-sm" />
      <div className="absolute inset-[18px] border border-[color:var(--ochre)]/30 rounded-sm" />

      <div className="seal-in flex flex-col items-center gap-2 text-center px-12 py-10 -rotate-[2.2deg]">
        <div className="stamp text-[color:var(--oxblood)] text-[0.75rem] border-2 border-[color:var(--oxblood)]/80 px-3 py-1">
          ★ deposit ★
        </div>
        <div
          className="wordmark text-6xl text-foreground mt-2"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wonk" 1' }}
        >
          Drop&nbsp;to&nbsp;file.
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="h-px w-10 bg-[color:var(--rule)]/50" />
          <p className="smallcaps text-xs text-muted-foreground tracking-[0.22em]">
            Filed in the current folder
          </p>
          <span className="h-px w-10 bg-[color:var(--rule)]/50" />
        </div>
        <p className="font-mono text-[0.65rem] text-muted-foreground/60 mt-2 tracking-widest">
          ⁂ release the cursor to commit ⁂
        </p>
      </div>
    </div>
  )
}
