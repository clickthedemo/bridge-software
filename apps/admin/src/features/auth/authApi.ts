import { apiRequest } from '../../lib/api/httpClient'
import type {
  CurrentUserResponse,
  EmailRequestResponse,
  LoginCredentials,
  LoginResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
} from './types'

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  forgotPassword(email: string) {
    return apiRequest<EmailRequestResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword(input: ResetPasswordInput, accessToken: string) {
    return apiRequest<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    })
  },

  getCurrentUser(accessToken: string) {
    return apiRequest<CurrentUserResponse>('/auth/me', { accessToken })
  },
}
