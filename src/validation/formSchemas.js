import { z } from 'zod';

const id = z.string().trim().min(1, 'A valid identifier is required.');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.');
const email = z.string().trim().email('Enter a valid email address.');
const nonEmpty = (label) => z.string().trim().min(1, `${label} is required.`);

export const passwordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z).')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z).')
  .regex(/[0-9]/, 'Password must contain at least one number (0-9).')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&* etc.).');

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required.') });
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
    email,
    password: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    invitationToken: z.string().optional(),
    otp: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }

    const hasInvite = Boolean(data.invitationToken && data.invitationToken.trim());
    if (!hasInvite) {
      if (!data.otp || !/^\d{6}$/.test(data.otp.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otp'],
          message: 'Verification code must be exactly 6 digits.',
        });
      }
    }
  });

export const resetPasswordOtpSchema = z
  .object({
    email,
    otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits.'),
    newPassword: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const resetPasswordOldSchema = z
  .object({
    email,
    oldPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current password.',
  });

export const clientSchema = z.object({ name: nonEmpty('Client name') });
export const projectSchema = z.object({
  clientId: id,
  name: nonEmpty('Project name'),
  initialRatePerHour: z.coerce.number().positive('Billing rate must be greater than zero.').optional(),
});
export const projectRateSchema = z.object({
  ratePerHour: z.coerce.number().positive('Rate must be greater than zero.'),
  effectiveFrom: isoDate,
});
export const projectStatusSchema = z.object({ status: z.enum(['ACTIVE', 'CLOSED']) });
export const clientStatusSchema = z.object({ isActive: z.boolean() });

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email,
  password: passwordStrengthSchema,
});
export const assignmentSchema = z.object({
  projectIds: z.array(id).min(1, 'Select at least one project.'),
});
export const userAssignmentSchema = z.object({
  userIds: z.array(id).min(1, 'Select at least one employee.'),
});
export const userStatusSchema = z.object({ isActive: z.boolean() });

export const timeOffRequestSchema = z.object({
  timeOffTypeId: id,
  startDate: isoDate,
  endDate: isoDate,
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters.'),
}).refine((data) => data.endDate >= data.startDate, {
  path: ['endDate'],
  message: 'End date cannot be earlier than start date.',
});
export const timeOffDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'DECLINED']),
  comment: z.string().trim().optional(),
}).superRefine((data, context) => {
  if (data.decision === 'DECLINED' && (!data.comment || data.comment.length < 5)) {
    context.addIssue({ path: ['comment'], code: z.ZodIssueCode.custom, message: 'Decline comment must be at least 5 characters.' });
  }
});

export const reviewReturnSchema = z.object({ entryId: id, comment: z.string().trim().min(5, 'Return comment must be at least 5 characters.') });
export const entryIdsSchema = z.object({ entryIds: z.array(id).min(1, 'Select at least one entry.') });
export const chaseSchema = z.object({ date: isoDate, userIds: z.array(id).min(1, 'Select at least one employee.') });
export const emailTestSchema = z.object({
  recipientEmail: email,
  emailType: z.string().trim().min(1, 'Email type is required.'),
});

export const grantSchema = z.object({
  userId: id.optional(),
  userIds: z.array(id).optional(),
  capabilityCode: nonEmpty('Capability'),
  scopeType: z.enum(['GLOBAL', 'USER', 'PROJECT']).optional(),
  targetUserIds: z.array(id).optional(),
  targetProjectIds: z.array(id).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
}).superRefine((data, context) => {
  if (!data.userId && (!data.userIds || data.userIds.length === 0)) {
    context.addIssue({ path: ['userId'], code: z.ZodIssueCode.custom, message: 'Select at least one target user.' });
  }
  if (data.scopeType === 'USER' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
    context.addIssue({ path: ['targetUserIds'], code: z.ZodIssueCode.custom, message: 'Select at least one target user for this scope.' });
  }
  if (data.scopeType === 'PROJECT' && (!data.targetProjectIds || data.targetProjectIds.length === 0)) {
    context.addIssue({ path: ['targetProjectIds'], code: z.ZodIssueCode.custom, message: 'Select at least one project for this scope.' });
  }
});

export const bulkRevokeSchema = z.object({ capabilityCode: nonEmpty('Capability'), userIds: z.array(id).min(1, 'Select at least one employee.') });
export const bulkGrantUpdateSchema = z.object({ grantIds: z.array(id).min(1, 'Select at least one grant.') });
