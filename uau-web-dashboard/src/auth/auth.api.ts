import { ApiEnvelope, LoginResponse } from '@/api/types'

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const envelope: ApiEnvelope<LoginResponse> = await response.json()

  if (!envelope.success) {
    throw new Error(envelope.error.message)
  }

  return envelope.data
}
