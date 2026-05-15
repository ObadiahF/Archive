import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { getFolderTree } from "@/api/api"
import type { FsFolder } from "@/api/types"
import { cn } from "@/lib/utils"
import { DRAG_MIME } from "@/components/FileList"

interface FolderTreeNodeProps {
  folder: FsFolder
  depth: number
  currentPath: string
  refreshKey: number
  onMove?: (fromPath: string, toFolderPath: string) => void
}

function FolderTreeNode({ folder, depth, currentPath, refreshKey, onMove }: FolderTreeNodeProps) {
  const isActive = currentPath === folder.path
  const isAncestor =
    currentPath === folder.path || currentPath.startsWith(folder.path + "/")
  const [expanded, setExpanded] = useState(isAncestor)
  const [children, setChildren] = useState<FsFolder[] | null>(null)
  const [dropOver, setDropOver] = useState(false)
  const prevIsAncestor = useRef(isAncestor)

  useEffect(() => {
    if (!prevIsAncestor.current && isAncestor) setExpanded(true)
    prevIsAncestor.current = isAncestor
  }, [isAncestor])

  useEffect(() => {
    if (!expanded) return
    let cancelled = false
    getFolderTree(folder.path).then((kids) => {
      if (!cancelled) setChildren(kids)
    })
    return () => {
      cancelled = true
    }
  }, [expanded, folder.path, refreshKey])

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (!onMove) return
          if (!e.dataTransfer.types.includes(DRAG_MIME)) return
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = "move"
        }}
        onDragEnter={(e) => {
          if (!onMove) return
          if (!e.dataTransfer.types.includes(DRAG_MIME)) return
          setDropOver(true)
        }}
        onDragLeave={() => setDropOver(false)}
        onDrop={(e) => {
          if (!onMove) return
          const from = e.dataTransfer.getData(DRAG_MIME)
          if (!from) return
          e.preventDefault()
          e.stopPropagation()
          setDropOver(false)
          onMove(from, folder.path)
        }}
        className={cn(
          "group relative flex items-center gap-1 py-1.5 pr-2 transition-colors cursor-pointer",
          "hover:bg-[color:var(--accent)]/60",
          isActive &&
            "bg-[color:var(--accent)] text-foreground before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[color:var(--ochre)] before:rounded-r-sm",
          dropOver &&
            "bg-[color:var(--accent)] outline outline-2 outline-[color:var(--ochre)] outline-offset-[-2px]",
        )}
        style={{ paddingLeft: depth * 14 + 10 }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-90",
            )}
          />
        </button>
        <Link
          to={`/files/${folder.path}`}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-sm group"
        >
          <span className={cn("folder-tab", expanded && "is-open")} aria-hidden />
          <span
            className={cn(
              "truncate font-serif tracking-tight",
              isActive ? "font-medium" : "font-normal",
            )}
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100' }}
          >
            {folder.name}
          </span>
        </Link>
      </div>
      {expanded && children && (
        <div className="relative">
          <span
            className="absolute top-0 bottom-0 w-px bg-[color:var(--border)]/70"
            style={{ left: depth * 14 + 18 }}
            aria-hidden
          />
          {children.map((child) => (
            <FolderTreeNode
              key={child.path}
              folder={child}
              depth={depth + 1}
              currentPath={currentPath}
              refreshKey={refreshKey}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FolderTreeProps {
  currentPath: string
  refreshKey: number
  onMove?: (fromPath: string, toFolderPath: string) => void
}

export function FolderTree({ currentPath, refreshKey, onMove }: FolderTreeProps) {
  const [roots, setRoots] = useState<FsFolder[]>([])
  const [rootDropOver, setRootDropOver] = useState(false)
  const { pathname } = useLocation()
  const isRootActive = pathname === "/files" || pathname === "/files/"

  useEffect(() => {
    let cancelled = false
    getFolderTree("").then((folders) => {
      if (!cancelled) setRoots(folders)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="space-y-px">
      <Link
        to="/files"
        onDragOver={(e) => {
          if (!onMove) return
          if (!e.dataTransfer.types.includes(DRAG_MIME)) return
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = "move"
        }}
        onDragEnter={(e) => {
          if (!onMove) return
          if (!e.dataTransfer.types.includes(DRAG_MIME)) return
          setRootDropOver(true)
        }}
        onDragLeave={() => setRootDropOver(false)}
        onDrop={(e) => {
          if (!onMove) return
          const from = e.dataTransfer.getData(DRAG_MIME)
          if (!from) return
          e.preventDefault()
          e.stopPropagation()
          setRootDropOver(false)
          onMove(from, "")
        }}
        className={cn(
          "relative flex items-center gap-2.5 py-1.5 pl-[10px] pr-2 text-sm transition-colors",
          "hover:bg-[color:var(--accent)]/60",
          isRootActive &&
            "bg-[color:var(--accent)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[color:var(--ochre)] before:rounded-r-sm",
          rootDropOver &&
            "bg-[color:var(--accent)] outline outline-2 outline-[color:var(--ochre)] outline-offset-[-2px]",
        )}
      >
        <span className="folder-tab is-open" aria-hidden />
        <span
          className={cn(
            "font-serif tracking-tight",
            isRootActive ? "font-medium" : "font-normal",
          )}
          style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100' }}
        >
          The Archive
        </span>
      </Link>
      <div className="mx-1 my-2 border-t border-dashed border-[color:var(--border)]/70" />
      {roots.map((folder) => (
        <FolderTreeNode
          key={folder.path}
          folder={folder}
          depth={0}
          currentPath={currentPath}
          refreshKey={refreshKey}
          onMove={onMove}
        />
      ))}
    </div>
  )
}
