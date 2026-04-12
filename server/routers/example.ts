import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '../trpc'

let users = [
  {
    name: 'demo',
    id: 1,
  },
  {
    name: 'kok',
    id: 2,
  },
]

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name ?? 'world'}` }
    }),

  bye: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { kok: `bye  ${input.name}` }
    }),

  getUsers: publicProcedure.query(() => {
    return { users }
  }),

  removeUsr: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation((opts) => {
      const { input } = opts

      const userToRemove = users.find((user) => user.id === input.id)

      if (!userToRemove) {
        console.log(`We weren't able to resolve the user id`)
        return
      }

      users = users.filter((user) => user.id !== userToRemove.id)

      return { res: `bye ${userToRemove.name}` }
    }),
})
