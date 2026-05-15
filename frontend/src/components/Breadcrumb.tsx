import { Link } from "react-router-dom"
import { Fragment, useState } from "react"
import { DRAG_MIME } from "@/components/FileList"
import { cn } from "@/lib/utils"

interface BreadcrumbProps {
  path: string
  onMove?: (fromPath: string, toFolderPath: string) => void
}

interface DropProps {
  targetPath: string
  onMove?: (fromPath: string, toFolderPath: string) => void
  children: (dropOver: boolean) => React.ReactNode
}

function DropCrumb({ targetPath, onMove, children }: DropProps) {
  const [dropOver, setDropOver] = useState(false)
  if (!onMove) return <>{children(false)}</>
  return (
    <span
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_MIME)) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"
      }}
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_MIME)) return
        setDropOver(true)
      }}
      onDragLeave={() => setDropOver(false)}
      onDrop={(e) => {
        const from = e.dataTransfer.getData(DRAG_MIME)
        if (!from) return
        e.preventDefault()
        e.stopPropagation()
        setDropOver(false)
        onMove(from, targetPath)
      }}
    >
      {children(dropOver)}
    </span>
  )
}

export function Breadcrumb({ path, onMove }: BreadcrumbProps) {
  const parts = path.split("/").filter(Boolean)
  const crumbs = parts.map((name, i) => ({
    name,
    folder: parts.slice(0, i + 1).join("/"),
    href: `/files/${parts.slice(0, i + 1).join("/")}`,
  }))

  const dropClasses = (over: boolean) =>
    over ? "bg-[color:var(--accent)] outline outline-2 outline-[color:var(--ochre)] outline-offset-[-2px]" : ""

  return (
    <nav className="flex items-center gap-2 text-sm overflow-x-auto">
      <span className="smallcaps text-[0.62rem] text-muted-foreground mr-1 tracking-[0.18em]">
        Filed under
      </span>
      <DropCrumb targetPath="" onMove={onMove}>
        {(over) => (
          <Link
            to="/files"
            className={cn(
              "font-serif italic text-muted-foreground hover:text-[color:var(--ochre)] transition-colors px-1 rounded-sm",
              dropClasses(over),
            )}
            style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
          >
            Archive
          </Link>
        )}
      </DropCrumb>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <Fragment key={crumb.href}>
            <span className="text-[color:var(--rule)]/60 font-serif select-none" aria-hidden>
              ⁄
            </span>
            {isLast ? (
              <span
                className="font-serif font-medium text-foreground tracking-tight"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
              >
                {crumb.name}
              </span>
            ) : (
              <DropCrumb targetPath={crumb.folder} onMove={onMove}>
                {(over) => (
                  <Link
                    to={crumb.href}
                    className={cn(
                      "font-serif italic text-muted-foreground hover:text-[color:var(--ochre)] transition-colors px-1 rounded-sm",
                      dropClasses(over),
                    )}
                    style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
                  >
                    {crumb.name}
                  </Link>
                )}
              </DropCrumb>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
