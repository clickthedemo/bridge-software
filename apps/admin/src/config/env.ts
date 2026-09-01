const removeTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const env = {
  apiBaseUrl: removeTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  ),
}
