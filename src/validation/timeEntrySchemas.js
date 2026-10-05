import { z } from 'zod';

export const timeEntryFormSchema = z.object({
  projectId: z.string().trim().min(1, 'Select a project.'),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date must use YYYY-MM-DD format.'),
  durationHours: z.coerce.number()
    .positive('Duration must be greater than zero.')
    .max(16, 'A single entry cannot exceed 16 hours.')
    .refine((value) => Number.isInteger(value * 4), 'Duration must use 15-minute increments.'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters.'),
});
