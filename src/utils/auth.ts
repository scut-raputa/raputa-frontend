import type { UserVO } from '@/types/response'

const TOKEN_KEY = 'raputa_token'
const USER_KEY = 'raputa_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): UserVO | null {
  try {
    const s = localStorage.getItem(USER_KEY)
    return s ? (JSON.parse(s) as UserVO) : null
  } catch {
    return null
  }
}
export function setUser(u: UserVO) {
  localStorage.setItem(USER_KEY, JSON.stringify(u))
}
export function clearUser() {
  localStorage.removeItem(USER_KEY)
}
