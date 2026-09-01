export type LoginCredentials = {
  email: string
  password: string
}

export type EmailRequestResponse = {
  code: 'AUTH_EMAIL_REQUEST_ACCEPTED'
  message: string
}

export type ResetPasswordInput = {
  newPassword: string
  refreshToken: string
}

export type ResetPasswordResponse = {
  code: 'AUTH_PASSWORD_RESET_COMPLETED'
  message: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number | null
  expiresIn: number
  tokenType: string
}

export type LoginResponse = AuthSession & {
  user: {
    id: string
    email: string | null
  }
}

export type AccountType = 'standard' | 'sales_rep'
export type PlatformRole = 'admin'
export type OrganizationType = 'brand' | 'retailer' | 'dispensary'
export type OrganizationRole = 'owner' | 'admin' | 'reviewer' | 'member'
export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'removed'

export type AppRole = 'brand' | 'retailer' | 'sales_rep' | 'admin'

export type AdminUser = {
  id: string
  email: string | null
  accountType: AccountType | null
  platformRoles: PlatformRole[]
  profile: {
    displayName: string | null
    phone: string | null
  } | null
}

export type OrganizationMembership = {
  organizationId: string
  organizationName: string
  organizationType: OrganizationType | null
  role: OrganizationRole
  status: MembershipStatus
}

export type CurrentUserResponse = {
  user: AdminUser
  memberships: OrganizationMembership[]
}
