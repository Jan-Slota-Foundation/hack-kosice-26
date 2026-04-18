import { analysisJobsRouter } from './routers/analysisJobs'
import { bytemapRouter } from './routers/bytemaps'
import { rawImagesRouter } from './routers/rawImages'
import { userRouter } from './routers/user'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  user: userRouter,
  bytemaps: bytemapRouter,
  analysisJobs: analysisJobsRouter,
  rawImages: rawImagesRouter,
})

export type AppRouter = typeof appRouter
