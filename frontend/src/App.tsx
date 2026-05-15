import { Navigate, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { FileBrowser } from "@/components/FileBrowser"
import { ThemeProvider } from "@/lib/theme"

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/files/*" element={<FileBrowser />} />
          <Route path="*" element={<Navigate to="/files" replace />} />
        </Routes>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
