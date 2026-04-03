const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

const sessionCreateSchema = z.object({
  type: z.enum(['mat_pilates', 'reformer', 'personal_training']),
  isZoom: z.boolean().optional(),
  zoomLink: z.string().optional(),
  trainer: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  maxCapacity: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const sessionUpdateSchema = sessionCreateSchema.partial();

const bookSchema = z.object({
  sessionId: z.string().min(1),
});

const packageCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  classType: z.enum(['mat_pilates', 'reformer', 'personal_training', 'zoom', 'all']),
  durationWeeks: z.number().int().min(1),
  classesPerWeek: z.number().int().min(1).max(10),
  price: z.number().int().min(0),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  isActive: z.boolean().optional(),
});

const purchaseSchema = z.object({
  packageId: z.string().min(1),
});

const trainerInviteSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

const profileUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().max(32).optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: 'Provide name and/or phone to update',
  });

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sessionCreateSchema,
  sessionUpdateSchema,
  bookSchema,
  packageCreateSchema,
  purchaseSchema,
  trainerInviteSchema,
  profileUpdateSchema,
};
