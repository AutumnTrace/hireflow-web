/**
 * Fetches a recruiter token from the API's development endpoint (POST /auth/token).
 * A real deployment would swap this for an OIDC login; the rest of the app only
 * cares that a bearer token exists.
 */
export async function fetchDevToken(apiUrl: string, name = 'Demo Recruiter'): Promise<string> {
  const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role: 'Recruiter' }),
  })

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'This API does not expose /auth/token. Enable Jwt:EnableDevTokens or use Demo mode.'
        : `Sign-in failed (${response.status}).`,
    )
  }

  const body = (await response.json()) as { accessToken: string }
  return body.accessToken
}
