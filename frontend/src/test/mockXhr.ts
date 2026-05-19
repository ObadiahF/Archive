import { vi } from "vitest"

export interface XhrSpec {
  status: number
  body: unknown
  progress?: Array<{ loaded: number; total: number }>
}

interface RecordedRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: unknown
}

interface MockXhrControl {
  requests: RecordedRequest[]
  restore: () => void
}

/**
 * Replace global XMLHttpRequest with a fake that resolves with the given spec.
 * Returns the recorded requests array (filled as XHRs are sent) and a restore fn.
 */
export function installMockXhr(spec: XhrSpec): MockXhrControl {
  const requests: RecordedRequest[] = []
  const RealXhr = globalThis.XMLHttpRequest

  class FakeXhr {
    readonly upload = {
      onprogress: null as null | ((e: { lengthComputable: boolean; loaded: number; total: number }) => void),
    }
    onload: null | (() => void) = null
    onerror: null | (() => void) = null
    status = 0
    responseText = ""
    private method = "GET"
    private url = ""
    private headers: Record<string, string> = {}

    open(method: string, url: string) {
      this.method = method
      this.url = url
    }
    setRequestHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value
    }
    send(body: unknown) {
      requests.push({ method: this.method, url: this.url, headers: this.headers, body })
      queueMicrotask(() => {
        for (const ev of spec.progress ?? []) {
          this.upload.onprogress?.({ lengthComputable: true, ...ev })
        }
        this.status = spec.status
        this.responseText =
          typeof spec.body === "string" ? spec.body : JSON.stringify(spec.body)
        this.onload?.()
      })
    }
  }

  vi.stubGlobal("XMLHttpRequest", FakeXhr as unknown as typeof XMLHttpRequest)

  return {
    requests,
    restore: () => {
      vi.stubGlobal("XMLHttpRequest", RealXhr)
    },
  }
}
