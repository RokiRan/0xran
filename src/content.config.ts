import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    kind: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    repo: z.string().url().nullable(),
    demo: z.string().url().nullable(),
    tags: z.array(z.string()).default([]),
    year: z.number(),
    status: z.enum(['wip', 'shipped', 'archived']),
  }),
});

export const collections = { blog, projects };
