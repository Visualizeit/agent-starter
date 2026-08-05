import { isNil } from 'es-toolkit/predicate'
import { nanoid } from 'nanoid'
import { useRef } from 'react'

interface PendingSubmission {
    fingerprint: string
    idempotencyKey: string
}

const useIdempotencyKey = () => {
    const pendingSubmissionRef = useRef<PendingSubmission>(null)

    const getIdempotencyKey = (submission: unknown) => {
        const fingerprint = JSON.stringify(submission)
        const pendingSubmission = pendingSubmissionRef.current

        if (
            isNil(pendingSubmission) ||
            pendingSubmission.fingerprint !== fingerprint
        ) {
            const idempotencyKey = nanoid()

            pendingSubmissionRef.current = {
                fingerprint,
                idempotencyKey,
            }

            return idempotencyKey
        }

        return pendingSubmission.idempotencyKey
    }

    const resetIdempotencyKey = () => {
        pendingSubmissionRef.current = null
    }

    return { getIdempotencyKey, resetIdempotencyKey }
}

export default useIdempotencyKey
