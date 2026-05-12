import type { UserVO } from '@/types/user'

let currentUser: UserVO | null = null

export function getToken(): string | null {
  return null
}
export function setToken(_token: string) {
  // Token is stored only in the HttpOnly RAPUTA_SESSION cookie.
}
export function clearToken() {
  // Cookie cleanup is handled by POST /api/user/logout.
}

export function getUser(): UserVO | null {
  return currentUser
}
export function setUser(u: UserVO) {
  currentUser = u
}
export function clearUser() {
  currentUser = null
}
