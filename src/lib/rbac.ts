import type { AdminRole, VerificationStatus } from './auth';

/**
 * Permission definitions per role.
 * These are evaluated server-side — never trust client-sent roles.
 */

export const PERMISSIONS = {
  // SuperAdmin exclusive
  APPROVE_FACILITATOR: ['superadmin'],
  REJECT_FACILITATOR: ['superadmin'],
  VIEW_ALL_FACILITATORS: ['superadmin'],
  VIEW_ALL_STARTUPS: ['superadmin'],
  OVERRIDE_MODERATION: ['superadmin'],
  SUSPEND_ANY_USER: ['superadmin'],
  VIEW_FULL_ANALYTICS: ['superadmin'],
  VIEW_ALL_FEED: ['superadmin'],
  MANAGE_TRENDING: ['superadmin'],
  MANAGE_RESOURCES: ['superadmin'],

  // Facilitator + SuperAdmin
  POST_JOB: ['superadmin', 'facilitator', 'startup'],
  POST_GIG: ['superadmin', 'facilitator', 'startup'],
  POST_EVENT: ['superadmin', 'facilitator', 'startup'],
  POST_COMPETITION: ['superadmin', 'facilitator', 'startup'],
  APPROVE_STARTUP: ['superadmin', 'facilitator'],
  REJECT_STARTUP: ['superadmin', 'facilitator'],
  SUSPEND_STARTUP: ['superadmin', 'facilitator'],
  VIEW_OWN_APPLICANTS: ['superadmin', 'facilitator', 'startup'],
  VIEW_FACILITATOR_ANALYTICS: ['superadmin', 'facilitator'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a given permission.
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

/**
 * Determine the correct redirect path for a user based on their role and status.
 */
export function getRedirectPath(
  role: AdminRole | null,
  status: VerificationStatus | null,
  hasProfile: boolean
): string {
  if (!hasProfile || !role) return '/onboarding';

  if (role === 'superadmin') return '/dashboard';

  if (role === 'facilitator') {
    if (status === 'approved') return '/facilitator/dashboard';
    if (status === 'pending') return '/pending-verification';
    if (status === 'rejected') return '/pending-verification?status=rejected';
    if (status === 'suspended') return '/pending-verification?status=suspended';
    return '/pending-verification';
  }

  if (role === 'startup') {
    if (status === 'approved') return '/startup/dashboard';
    if (status === 'pending') return '/pending-approval';
    if (status === 'rejected') return '/pending-approval?status=rejected';
    if (status === 'suspended') return '/pending-approval?status=suspended';
    return '/pending-approval';
  }

  return '/login';
}

/**
 * Validate that a facilitator owns a specific startup assignment.
 * Throws if the facilitator doesn't own the startup.
 */
export function assertFacilitatorOwnsStartup(
  facilitatorId: string,
  assignmentFacilitatorId: string | null
): void {
  if (assignmentFacilitatorId !== facilitatorId) {
    throw new Error('Forbidden: you do not have access to this startup');
  }
}

/**
 * Validate that a startup owns a content item.
 */
export function assertStartupOwnsItem(
  startupId: string,
  itemStartupId: string | null
): void {
  if (itemStartupId !== startupId) {
    throw new Error('Forbidden: you do not have access to this item');
  }
}
