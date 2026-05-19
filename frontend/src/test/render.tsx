import type { ReactElement, ReactNode } from "react"
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom"
import { render, type RenderOptions, type RenderResult } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TooltipProvider } from "@/components/ui/tooltip"

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  routerProps?: MemoryRouterProps
}

export function renderWithProviders(
  ui: ReactElement,
  { routerProps, ...renderOptions }: RenderWithProvidersOptions = {},
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter {...routerProps}>
      <TooltipProvider>{children}</TooltipProvider>
    </MemoryRouter>
  )
  const result = render(ui, { wrapper: Wrapper, ...renderOptions })
  return { ...result, user }
}

export { screen, within, waitFor, fireEvent } from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
