import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { KeyRound, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Design-only — no auth wired. Simulate a beat, then return to /files.
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate("/files")
    }, 650)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Faint corner ornaments — like reference marks on a folio sheet */}
      <span
        aria-hidden
        className="absolute top-6 left-6 font-mono text-[0.6rem] text-muted-foreground/60 tracking-[0.32em] smallcaps"
      >
        Archive · vol. I · clearance log
      </span>
      <span
        aria-hidden
        className="absolute top-6 right-6 font-mono text-[0.6rem] text-muted-foreground/60 tabular"
      >
        № 047 / 1986
      </span>
      <span
        aria-hidden
        className="absolute bottom-6 left-6 font-mono text-[0.55rem] text-muted-foreground/50 tracking-[0.28em] smallcaps"
      >
        ⁂ confidential ⁂
      </span>
      <span
        aria-hidden
        className="absolute bottom-6 right-6 font-mono text-[0.55rem] text-muted-foreground/50 tabular"
      >
        sec/07-A
      </span>

      <div className="w-full max-w-[26rem] relative">
        {/* Manila tab — sits above the card like a filing-cabinet folder. */}
        <div className="absolute -top-3 left-6 z-20 select-none">
          <div className="relative inline-flex items-center gap-2 pl-3 pr-5 py-1 bg-[color:var(--ochre)] text-[color:var(--background)] shadow-[2px_2px_0_0_var(--rule)]">
            <span className="smallcaps text-[0.62rem] tracking-[0.22em] font-semibold">
              Authorization
            </span>
            {/* angled cut on the right edge */}
            <span
              aria-hidden
              className="absolute top-0 right-0 h-full w-3 bg-[color:var(--background)]"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            />
          </div>
        </div>

        {/* Folder card */}
        <div className="relative z-10 bg-[color:var(--card)] border border-[color:var(--rule)]/55 px-8 pt-12 pb-7 shadow-[6px_6px_0_0_color-mix(in_oklch,var(--rule)_30%,transparent)]">
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span
                className="wordmark text-4xl text-foreground"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wonk" 1' }}
              >
                Archive<span className="text-[color:var(--ochre)]">.</span>
              </span>
            </div>
            <p
              className="mt-1 font-serif italic text-sm text-muted-foreground"
              style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
            >
              Identify yourself to enter the cabinet.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-user"
                className="smallcaps text-[0.65rem] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5 mb-1.5"
              >
                <User className="h-3 w-3" />
                Operator
              </label>
              <Input
                id="login-user"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alias"
                autoComplete="username"
                className="font-mono rounded-sm border-[color:var(--rule)]/40 focus-visible:border-[color:var(--ochre)] focus-visible:ring-[color:var(--ochre)]/30"
              />
            </div>

            <div>
              <label
                htmlFor="login-pass"
                className="smallcaps text-[0.65rem] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5 mb-1.5"
              >
                <KeyRound className="h-3 w-3" />
                Cipher
              </label>
              <Input
                id="login-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="font-mono tracking-widest rounded-sm border-[color:var(--rule)]/40 focus-visible:border-[color:var(--ochre)] focus-visible:ring-[color:var(--ochre)]/30"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none group pt-1 w-fit">
              <input
                type="checkbox"
                className="peer appearance-none h-3.5 w-3.5 rounded-[2px] border border-[color:var(--rule)]/50 bg-transparent checked:bg-[color:var(--ochre)] checked:border-[color:var(--ochre)] transition-colors"
              />
              <span className="smallcaps text-[0.6rem] tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
                Remember this terminal
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full smallcaps text-[0.72rem] tracking-[0.28em] py-2.5 mt-2 rounded-sm"
            >
              {submitting ? "Verifying…" : "Open the cabinet"}
            </Button>
          </form>

          {/* Footer rule + line */}
          <div className="mt-6 pt-4 border-t border-dashed border-[color:var(--rule)]/40 flex items-center justify-between">
            <span className="font-mono text-[0.6rem] text-muted-foreground/70 tabular">
              ⁂ unauthorized entries are logged
            </span>
            <span className="font-mono text-[0.6rem] text-muted-foreground/60 tabular">
              v.0.4.7
            </span>
          </div>
        </div>

        {/* Wax-seal style stamp, rotated, perched at the corner */}
        <div
          aria-hidden
          className="absolute -bottom-5 -right-4 z-20 stamp text-[color:var(--oxblood)] text-[0.62rem] border-2 border-[color:var(--oxblood)]/80 px-2.5 py-1 rotate-[10deg] bg-[color:var(--background)]"
        >
          ★ Restricted ★
        </div>
      </div>
    </div>
  )
}
