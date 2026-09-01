import { ApiError } from '../../lib/api/httpClient'
import type { LoginErrorMessage } from './getLoginErrorMessage'

export function getPasswordRecoveryError(error: unknown): LoginErrorMessage {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        title: 'API connection unavailable',
        message: 'Start the BRIDGE API on port 4000, then try again.',
      }
    }

    if (error.status === 401) {
      return {
        title: 'Recovery link expired',
        message: 'Request a new password recovery email and use its latest link.',
      }
    }

    if (error.status === 503 || error.code === 'AUTH_PROVIDER_UNAVAILABLE') {
      return {
        title: 'Password service unavailable',
        message: 'Password recovery is temporarily unavailable. Please try again shortly.',
      }
    }

    return { title: 'Request unsuccessful', message: error.message }
  }

  return {
    title: 'Request unsuccessful',
    message: 'Something unexpected happened. Please try again.',
  }
}
