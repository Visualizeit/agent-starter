import { eq } from 'drizzle-orm'
import { isNil } from 'es-toolkit/predicate'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { projectFormSchema } from '@/schemas/project-form-schema'
import database from '@/server/db/client'
import { projects } from '@/server/db/schema'

import base from '../base'

const idSchema = z.string().min(1)

const projectRouter = {
    add: base.input(projectFormSchema).handler(async ({ input, errors }) => {
        const [projectRecord] = await database
            .insert(projects)
            .values({
                id: nanoid(),
                instructions: input.instructions,
                name: input.name,
            })
            .returning()

        if (isNil(projectRecord)) {
            throw errors.CONFLICT()
        }

        return projectRecord
    }),
    delete: base
        .input(z.object({ id: idSchema }))
        .handler(async ({ input, errors }) => {
            const [deletedProject] = await database
                .delete(projects)
                .where(eq(projects.id, input.id))
                .returning()

            if (isNil(deletedProject)) {
                throw errors.NOT_FOUND()
            }

            return deletedProject
        }),
    find: base
        .input(z.object({ id: idSchema }))
        .handler(async ({ input, errors }) => {
            const projectRecord = await database.query.projects.findFirst({
                where: {
                    id: input.id,
                },
            })

            if (isNil(projectRecord)) {
                throw errors.NOT_FOUND()
            }

            return projectRecord
        }),
    list: base.handler(async () => {
        const records = await database.query.projects.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
            with: {
                conversations: {
                    orderBy: {
                        isPinned: 'desc',
                        updatedAt: 'desc',
                    },
                    where: {
                        status: 'active',
                    },
                },
            },
        })

        return { list: records }
    }),
    update: base
        .input(projectFormSchema.extend({ id: idSchema }))
        .handler(async ({ input, errors }) => {
            const [updatedProject] = await database
                .update(projects)
                .set({
                    instructions: input.instructions,
                    name: input.name,
                })
                .where(eq(projects.id, input.id))
                .returning()

            if (isNil(updatedProject)) {
                throw errors.NOT_FOUND()
            }

            return updatedProject
        }),
}

export default projectRouter
