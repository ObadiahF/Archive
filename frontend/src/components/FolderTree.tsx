import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { getFolderTree } from "@/api/mockApi"
import type { FsFolder } from "@/api/types"
import { cn } from "@/lib/utils"

interface FolderTreeNodeProps {
  folder: FsFolder
  depth: number
  currentPath: string
  refreshKey: number
}

function FolderTreeNode({ folder, depth, currentPath, refreshKey }: FolderTreeNodeProps) {
  const isActive = currentPath === folder.path
  const isAncestor =
    currentPath === folder.path || currentPath.startsWith(folder.path + "/")
  const [expanded, setExpanded] = useState(isAncestor)
  const [children, setChildren] = useState<FsFolder[] | null>(null)
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
        className={cn(
          "group flex items-center gap-1 py-1 pr-2 rounded-md hover:bg-accent transition-colors cursor-pointer",
          isActive && "bg-accent text-accent-foreground font-medium",
        )}
        style={{ paddingLeft: depth * 12 + 4 }}
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
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
        <Link
          to={`/files/${folder.path}`}
          className="flex items-center gap-2 flex-1 min-w-0 text-sm"
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}
          <span className="truncate">{folder.name}</span>
        </Link>
      </div>
      {expanded && children && (
        <div>
          {children.map((child) => (
            <FolderTreeNode
              key={child.path}
              folder={child}
              depth={depth + 1}
              currentPath={currentPath}
              refreshKey={refreshKey}
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
}

export function FolderTree({ currentPath, refreshKey }: FolderTreeProps) {
  const [roots, setRoots] = useState<FsFolder[]>([])
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
    <div className="space-y-0.5">
      <Link
        to="/files"
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-accent transition-colors text-sm",
          isRootActive && "bg-accent text-accent-foreground font-medium",
        )}
      >
        <Folder className="h-4 w-4 shrink-0 text-blue-500" />
        <span>All files</span>
      </Link>
      {roots.map((folder) => (
        <FolderTreeNode
          key={folder.path}
          folder={folder}
          depth={0}
          currentPath={currentPath}
          refreshKey={refreshKey}
        />
      ))}
    </div>
  )
}
