import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

interface BreadcrumbProps {
  path: string
}

export function Breadcrumb({ path }: BreadcrumbProps) {
  const parts = path.split("/").filter(Boolean)
  const crumbs = parts.map((name, i) => ({
    name,
    href: `/files/${parts.slice(0, i + 1).join("/")}`,
  }))

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      <Link
        to="/files"
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <Fragment key={crumb.href}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {isLast ? (
              <span className="px-2 py-1 font-medium text-foreground">
                {crumb.name}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {crumb.name}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
