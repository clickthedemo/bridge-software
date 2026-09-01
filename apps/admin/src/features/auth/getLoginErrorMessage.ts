import { ApiError } from '../../lib/api/httpClient'

export type LoginErrorMessage = {
  title: string
  message: string
}

export function getLoginErrorMessage(error: unknown): LoginErrorMessage {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        title: 'API connection unavailable',
        message: 'Start the BRIDGE API on port 4000, then try signing in again.',
      }
    }

    if (error.status === 401 || error.code === 'AUTH_LOGIN_FAILED') {
      return {
        title: 'Sign-in unsuccessful',
        message: 'Check your email and password, then try again.',
      }
    }

    if (error.status === 503 || error.code === 'AUTH_PROVIDER_UNAVAILABLE') {
      return {
        title: 'Authentication is unavailable',
        message: 'The sign-in service is temporarily unavailable. Please try again shortly.',
      }
    }

    return {
      title: 'Unable to sign in',
      message: error.message,
    }
  }

  if (error instanceof Error && error.message.includes('platform administrator')) {
    return {
      title: 'Admin access required',
      message: 'This account is valid but does not have permission to access BRIDGE administration.',
    }
  }

  return {
    title: 'Unable to sign in',
    message: 'Something unexpected happened. Please try again.',
  }
}
