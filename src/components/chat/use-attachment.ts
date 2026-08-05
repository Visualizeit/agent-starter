import { useMutation } from '@tanstack/react-query'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { createFilesClient } from 'files-sdk/client'
import { useRef, useState } from 'react'

import orpc from '@/lib/orpc'

interface PendingAttachment {
    attachmentId: string | null
    file: File
    storageKey: string | null
}

interface UploadVariables {
    conversationId: string
    file: File
}

const useAttachment = () => {
    const [pendingAttachment, setPendingAttachment] =
        useState<PendingAttachment | null>(null)

    const fileInputResetRef = useRef<() => void>(null)

    const uploadMutation = useMutation({
        mutationFn: ({ conversationId, file }: UploadVariables) => {
            const files = createFilesClient({
                endpoint: '/api/files',
                headers: {
                    'x-conversation-id': conversationId,
                },
            })

            return files.upload(file)
        },
    })
    const registerMutation = useMutation(
        orpc.attachment.register.mutationOptions()
    )
    const deleteMutation = useMutation(orpc.attachment.delete.mutationOptions())

    const resetFileInput = () => {
        const resetFileInputFunction = fileInputResetRef.current

        if (isNotNil(resetFileInputFunction)) {
            resetFileInputFunction()
        }
    }

    const reset = () => {
        uploadMutation.reset()
        registerMutation.reset()
        deleteMutation.reset()
        setPendingAttachment(null)
        resetFileInput()
    }

    const handleFileChange = (file: File | null) => {
        if (isNil(file)) {
            return
        }

        uploadMutation.reset()
        registerMutation.reset()
        deleteMutation.reset()
        setPendingAttachment({
            attachmentId: null,
            file,
            storageKey: null,
        })
    }

    const remove = async (conversationId: string | null) => {
        if (
            isNotNil(conversationId) &&
            isNotNil(pendingAttachment) &&
            isNotNil(pendingAttachment.attachmentId)
        ) {
            await deleteMutation.mutateAsync({
                conversationId,
                id: pendingAttachment.attachmentId,
            })
        }

        reset()
    }

    const register = async (conversationId: string) => {
        if (isNil(pendingAttachment)) {
            return []
        }

        if (isNotNil(pendingAttachment.attachmentId)) {
            return [pendingAttachment.attachmentId]
        }

        let { storageKey } = pendingAttachment

        if (isNil(storageKey)) {
            try {
                const uploadedFile = await uploadMutation.mutateAsync({
                    conversationId,
                    file: pendingAttachment.file,
                })

                storageKey = uploadedFile.key
                setPendingAttachment({
                    ...pendingAttachment,
                    storageKey,
                })
            } catch {
                return null
            }
        }

        try {
            const attachment = await registerMutation.mutateAsync({
                conversationId,
                filename: pendingAttachment.file.name,
                key: storageKey,
            })

            setPendingAttachment({
                ...pendingAttachment,
                attachmentId: attachment.id,
                storageKey,
            })

            return [attachment.id]
        } catch {
            return null
        }
    }

    const requestError =
        uploadMutation.error ?? registerMutation.error ?? deleteMutation.error

    return {
        error: isNotNil(requestError) ? requestError.message : undefined,
        fileInputResetRef,
        filename: isNotNil(pendingAttachment)
            ? pendingAttachment.file.name
            : null,
        handleFileChange,
        isPending:
            uploadMutation.isPending ||
            registerMutation.isPending ||
            deleteMutation.isPending,
        register,
        remove,
        reset,
    }
}

export default useAttachment
