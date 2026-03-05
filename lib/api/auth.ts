export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName }),
  })
  return response.json()
}

export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })
  return response.json()
}

export async function getCurrentUser() {
  const response = await fetch('/api/users/me')
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
}

export async function getProfile() {
  const response = await fetch('/api/users/profile')
  if (!response.ok) throw new Error('Failed to fetch profile')
  return response.json()
}

export async function updateProfile(updates: Record<string, any>) {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}
