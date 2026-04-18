import { analysisJobsRouter } from './routers/analysisJobs'
import { bytemapRouter } from './routers/bytemaps'
import { exampleRouter } from './routers/example'
import { rawImagesRouter } from './routers/rawImages'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  bytemaps: bytemapRouter,
  analysisJobs: analysisJobsRouter,
  rawImages: rawImagesRouter,
})

export type AppRouter = typeof appRouter
