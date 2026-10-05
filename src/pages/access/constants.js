// ─── Capability metadata ───────────────────────────────────────────────────────

export const CAP_META = {
  VIEW_OTHER_RECORDS:      { label: 'View Other Records',         desc: "Read work logs and timesheets of other staff members." },
  REVIEW_TIME:             { label: 'Review Time',                desc: "Approve or return submitted time entries (within scope)." },
  DECIDE_TIME_OFF:         { label: 'Decide Time Off',            desc: "Approve or decline employee time-off requests (within scope)." },
  MANAGE_CLIENTS_PROJECTS: { label: 'Manage Clients & Projects',  desc: "Create and configure clients, projects, and billing rates." },
  ASSIGN_PROJECTS:         { label: 'Assign Projects',            desc: "Assign and remove employees on client projects." },
  MANAGE_USERS:            { label: 'Manage Users',               desc: "Create and manage user accounts." },
  VIEW_REPORTS:            { label: 'View Reports',               desc: "Access cross-project summary reports and CSV exports." },
  VIEW_ANALYTICS:          { label: 'View Analytics',             desc: "View utilization rates and billable hours distribution." },
  VIEW_BILLING:            { label: 'View Billing',               desc: "Access sensitive billing rate figures and monetary totals." },
};

export const ALL_CAP_CODES = Object.keys(CAP_META);
