import { stat } from 'node:fs/promises'
import path from 'node:path'

import { and, eq } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { isNil } from 'es-toolkit/predicate'
import { execa, ExecaError } from 'execa'
import { nanoid } from 'nanoid'
import { match } from 'ts-pattern'
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
const selectedPathSchema = z.string().min(1)

const isDirectoryPickerCancellation = (error: unknown) => {
    if (!(error instanceof ExecaError) || error.exitCode !== 1) {
        return false
    }

    if (process.platform === 'darwin') {
        return error.message.includes('(-128)')
    }

    return process.platform !== 'win32'
}

const pickDirectoryPath = async () => {
    try {
        const { command, commandArguments } = match(process.platform)
            .with('darwin', () => ({
                command: 'osascript',
                commandArguments: [
                    '-e',
                    'POSIX path of (choose folder with prompt "Choose a project folder")',
                ],
            }))
            .with('win32', () => ({
                command: 'powershell.exe',
                commandArguments: [
                    '-NoProfile',
                    '-Command',
                    'Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.SelectedPath }',
                ],
            }))
            .otherwise(() => ({
                command: 'zenity',
                commandArguments: [
                    '--file-selection',
                    '--directory',
                    '--title=Choose a project folder',
                ],
            }))

        const { stdout } = await execa(command, commandArguments)

        return stdout
    } catch (error) {
        if (isDirectoryPickerCancellation(error)) {
            return null
        }

        throw error
    }
}

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
    add: base.handler(async ({ errors }) => {
        const selectedPath = await pickDirectoryPath()
        const selectedPathParseResult =
            selectedPathSchema.safeParse(selectedPath)

        // selectedPathParseResult.
        if (!selectedPathParseResult.success) {
            return { status: 'cancelled' as const }
        }

        const resolvedPath = await resolveProjectPath(
            selectedPathParseResult.data
        )

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
                setWhere: eq(projects.status, 'removed'),
                target: projects.path,
            })
            .returning()

        if (isNil(projectRecord)) {
            throw errors.CONFLICT()
        }

        return { project: projectRecord, status: 'created' as const }
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
    remove: base
        .input(z.object({ id: idSchema }))
        .handler(async ({ input, errors }) => {
            const [removedProject] = await database
                .update(projects)
                .set({
                    status: 'removed',
                })
                .where(
                    and(
                        eq(projects.id, input.id),
                        eq(projects.status, 'active')
                    )
                )
                .returning()

            if (isNil(removedProject)) {
                throw errors.NOT_FOUND()
            }

            return removedProject
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
