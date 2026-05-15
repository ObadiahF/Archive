import { Link } from "react-router-dom"
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
    <nav className="flex items-center gap-2 text-sm overflow-x-auto">
      <span className="smallcaps text-[0.62rem] text-muted-foreground mr-1 tracking-[0.18em]">
        Filed under
      </span>
      <Link
        to="/files"
        className="font-serif italic text-muted-foreground hover:text-[color:var(--ochre)] transition-colors"
        style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
      >
        Archive
      </Link>
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
              <Link
                to={crumb.href}
                className="font-serif italic text-muted-foreground hover:text-[color:var(--ochre)] transition-colors"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
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
