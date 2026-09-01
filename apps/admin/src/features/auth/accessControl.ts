import type { AdminUser, AppRole, OrganizationMembership } from './types'

export const ALL_APP_ROLES: readonly AppRole[] = [
  'admin',
  'sales_rep',
  'brand',
  'retailer',
]

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  sales_rep: 'Sales Rep',
  brand: 'Brand',
  retailer: 'Retailer',
}

export function getAppRoles(
  user: AdminUser,
  memberships: OrganizationMembership[],
): AppRole[] {
  const roles = new Set<AppRole>()

  if (user.platformRoles.includes('admin')) roles.add('admin')
  if (user.accountType === 'sales_rep') roles.add('sales_rep')

  memberships
    .filter(({ status }) => status === 'active')
    .forEach(({ organizationType }) => {
      if (organizationType === 'brand') roles.add('brand')
      if (organizationType === 'retailer' || organizationType === 'dispensary') {
        roles.add('retailer')
      }
    })

  return ALL_APP_ROLES.filter((role) => roles.has(role))
}

export function hasAnyRole(userRoles: AppRole[], allowedRoles: readonly AppRole[]) {
  return allowedRoles.some((role) => userRoles.includes(role))
}
