'use strict';

/**
 * Master permissions list.
 * Every action in the system maps to one of these strings.
 * Roles store a subset of these in their `permissions` array.
 */

const PERMISSIONS = {
  // ─── Labour ────────────────────────────────────────────
  LABOUR_VIEW:   'labour.view',
  LABOUR_CREATE: 'labour.create',
  LABOUR_EDIT:   'labour.edit',
  LABOUR_DELETE: 'labour.delete',       // soft delete
  LABOUR_HARD_DELETE: 'labour.hardDelete', // Super Admin only

  // ─── Groups ────────────────────────────────────────────
  GROUP_VIEW:    'group.view',
  GROUP_CREATE:  'group.create',
  GROUP_EDIT:    'group.edit',
  GROUP_DELETE:  'group.delete',
  GROUP_CONFIG:  'group.config',        // rate/split/multiplier settings

  // ─── Attendance ────────────────────────────────────────
  ATTENDANCE_VIEW:  'attendance.view',
  ATTENDANCE_MARK:  'attendance.mark',
  ATTENDANCE_EDIT:  'attendance.edit',

  // ─── Production ────────────────────────────────────────
  PRODUCTION_VIEW:   'production.view',
  PRODUCTION_CREATE: 'production.create',
  PRODUCTION_EDIT:   'production.edit',
  PRODUCTION_DELETE: 'production.delete',

  // ─── Billing ───────────────────────────────────────────
  BILLING_VIEW:     'billing.view',
  BILLING_GENERATE: 'billing.generate',
  BILLING_DOWNLOAD: 'billing.download',
  BILLING_PAY:      'billing.pay',

  // ─── Users ─────────────────────────────────────────────
  USER_VIEW:   'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT:   'user.edit',
  USER_DELETE: 'user.delete',

  // ─── Roles ─────────────────────────────────────────────
  ROLE_VIEW:   'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_EDIT:   'role.edit',
  ROLE_DELETE: 'role.delete',

  // ─── Settings ──────────────────────────────────────────
  SETTINGS_VIEW:   'settings.view',
  SETTINGS_EDIT:   'settings.edit',

  // ─── Public Website ────────────────────────────────────
  PUBLIC_SITE_VIEW:   'publicSite.view',
  PUBLIC_SITE_UPDATE: 'publicSite.update',

  // ─── Reports / Dashboard ───────────────────────────────
  DASHBOARD_VIEW: 'dashboard.view',
  REPORTS_VIEW:   'reports.view',
  REPORTS_EXPORT: 'reports.export',
};

/** All permission strings as a flat array (for Mongoose enum validation) */
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Default permission sets for each seeded role.
 */
const ROLE_DEFAULTS = {
  'Super Admin': ALL_PERMISSIONS,

  'Manager': [
    PERMISSIONS.LABOUR_VIEW, PERMISSIONS.LABOUR_CREATE, PERMISSIONS.LABOUR_EDIT, PERMISSIONS.LABOUR_DELETE,
    PERMISSIONS.GROUP_VIEW, PERMISSIONS.GROUP_CREATE, PERMISSIONS.GROUP_EDIT, PERMISSIONS.GROUP_DELETE, PERMISSIONS.GROUP_CONFIG,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT,
    PERMISSIONS.PRODUCTION_VIEW, PERMISSIONS.PRODUCTION_CREATE, PERMISSIONS.PRODUCTION_EDIT, PERMISSIONS.PRODUCTION_DELETE,
    PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_GENERATE, PERMISSIONS.BILLING_DOWNLOAD, PERMISSIONS.BILLING_PAY,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.PUBLIC_SITE_VIEW, PERMISSIONS.PUBLIC_SITE_UPDATE,
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
  ],

  'Supervisor': [
    PERMISSIONS.LABOUR_VIEW, PERMISSIONS.LABOUR_CREATE, PERMISSIONS.LABOUR_EDIT,
    PERMISSIONS.GROUP_VIEW, PERMISSIONS.GROUP_CONFIG,
    PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT,
    PERMISSIONS.PRODUCTION_VIEW, PERMISSIONS.PRODUCTION_CREATE, PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  'Accountant': [
    PERMISSIONS.LABOUR_VIEW,
    PERMISSIONS.GROUP_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_GENERATE, PERMISSIONS.BILLING_DOWNLOAD, PERMISSIONS.BILLING_PAY,
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  'Viewer': [
    PERMISSIONS.LABOUR_VIEW,
    PERMISSIONS.GROUP_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

module.exports = { PERMISSIONS, ALL_PERMISSIONS, ROLE_DEFAULTS };
