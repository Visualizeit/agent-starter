import { stat } from 'node:fs/promises'
import path from 'node:path'

import { and, eq } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { isNil } from 'es-toolkit/predicate'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import database from '@/server/db/client'
import { projects } from '@/server/db/schema'

import base from '../base'

const idSchema = z.string().min(1)
const projectInsertSchema = createInsertSchema(projects, {
    name: (schema) => schema.trim().min(1).max(200),
    path: (schema) => schema.trim().min(1),
})
const projectSelectSchema = createSelectSchema(projects)
const projectStatusSchema = projectSelectSchema.shape.status

const resolveProjectPath = async (projectPath: string) => {
    const resolvedPath = path.resolve(projectPath)

    try {
        const pathStats = await stat(resolvedPath)

        if (pathStats.isDirectory()) {
            return resolvedPath
        }

        return null
    } catch {
        return null
    }
}

const projectRouter = {
    create: base
        .input(projectInsertSchema.pick({ path: true }))
        .handler(async ({ input, errors }) => {
            const resolvedPath = await resolveProjectPath(input.path)

            if (isNil(resolvedPath)) {
                throw errors.BAD_REQUEST()
            }

            const [projectRecord] = await database
                .insert(projects)
                .values({
                    id: nanoid(),
                    name: path.basename(resolvedPath),
                    path: resolvedPath,
                })
                .onConflictDoUpdate({
                    set: {
                        status: 'active',
                    },
                    setWhere: eq(projects.status, 'deleted'),
                    target: projects.path,
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
                .update(projects)
                .set({
                    status: 'deleted',
                })
                .where(
                    and(
                        eq(projects.id, input.id),
                        eq(projects.status, 'active')
                    )
                )
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
    list: base
        .input(
            z.object({
                status: projectStatusSchema,
            })
        )
        .handler(async ({ input }) => {
            const records = await database.query.projects.findMany({
                orderBy: {
                    updatedAt: 'desc',
                },
                where: {
                    status: input.status,
                },
            })

            return { list: records }
        }),
    update: base
        .input(
            projectInsertSchema.pick({ name: true }).extend({
                id: idSchema,
            })
        )
        .handler(async ({ input, errors }) => {
            const [updatedProject] = await database
                .update(projects)
                .set({
                    name: input.name,
                })
                .where(
                    and(
                        eq(projects.id, input.id),
                        eq(projects.status, 'active')
                    )
                )
                .returning()

            if (isNil(updatedProject)) {
                throw errors.NOT_FOUND()
            }

            return updatedProject
        }),
}

export default projectRouter
