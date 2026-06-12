import { defineCollection, z } from 'astro:content';

const matchSchema = z.object({
  home: z.string(), away: z.string(),
  homeFlag: z.string().optional(), awayFlag: z.string().optional(),
  kickoff: z.string(),
  predHome: z.number(), predAway: z.number(),
  confidence: z.number().min(1).max(5),
  analysis: z.string(),
  actualHome: z.number().nullable().default(null),
  actualAway: z.number().nullable().default(null),
});

const pronos = defineCollection({
  type: 'content',
  schema: z.object({
    round: z.string(),
    order: z.number(),
    stage: z.enum(['group', 'knockout']).default('group'),
    matches: z.array(matchSchema),
  }),
});

export const collections = { pronos };
