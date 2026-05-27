import { z } from 'zod';

const ALGORITHMS = ['FCFS', 'SSTF', 'SCAN', 'C_SCAN', 'LOOK', 'C_LOOK'] as const;

export const diskInputSchema = z
  .object({
    algorithm: z.enum(ALGORITHMS),
    direction: z.enum(['LEFT', 'RIGHT']),
    maxCylinder: z.coerce
      .number({ invalid_type_error: 'Max cylinder must be a number' })
      .int()
      .min(1, 'Max cylinder must be at least 1')
      .max(50000, 'Value cannot exceed 50,000 for performance reasons'),
    initialHead: z.coerce
      .number({ invalid_type_error: 'Initial head must be a number' })
      .int()
      .min(0, 'Initial head must be non-negative'),
    queueInput: z.string().min(1, 'Queue cannot be empty'),
    includeEdges: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Cross-field validation 1: initialHead <= maxCylinder
    if (data.initialHead > data.maxCylinder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['initialHead'],
        message: 'Initial head cannot be greater than max cylinder',
      });
    }

    // Cross-field validation 2: All queue items <= maxCylinder
    const queueValues = data.queueInput
      .split(/[\s,]+/)
      .map(Number)
      .filter(Number.isFinite);

    const firstInvalidValue = queueValues.find(val => val > data.maxCylinder);
    
    if (firstInvalidValue !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['queueInput'],
        message: `Request ${firstInvalidValue} exceeds max cylinder (${data.maxCylinder})`,
      });
    }
  });

export type DiskInputFormValues = z.infer<typeof diskInputSchema>;
