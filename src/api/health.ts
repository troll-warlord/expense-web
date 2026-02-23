import axios from 'axios'

interface HealthResponse {
  status: 'ok' | 'degraded'
  db: 'ok' | 'unreachable'
}

export async function checkHealth(): Promise<HealthResponse> {
  // In dev, /health is proxied to the backend by Vite.
  // In production, VITE_API_BASE_URL is an absolute URL so we strip /v1 to get the root.
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const rootUrl = base ? base.replace(/\/v1\/?$/, '') : ''
  const { data } = await axios.get<HealthResponse>(`${rootUrl}/health`)
  return data
}
