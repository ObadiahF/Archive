import { Navigate, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { FileBrowser } from "@/components/FileBrowser"
import { Login } from "@/components/Login"
import { ThemeProvider } from "@/lib/theme"

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/files/*" element={<FileBrowser />} />
          <Route path="*" element={<Navigate to="/files" replace />} />
        </Routes>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
