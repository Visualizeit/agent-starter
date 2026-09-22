/* oxlint-disable react/refs */
/* oxlint-disable jsx_a11y/prefer-tag-over-role */

import 'prosekit/pm/view/style/prosemirror.css'
import 'prosekit/extensions/placeholder/style.css'
import { Box } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import {
    createEditor,
    defineBaseKeymap,
    defineHistory,
    defineKeyDownHandler,
    defineKeymap,
    union,
} from 'prosekit/core'
import { defineDoc } from 'prosekit/extensions/doc'
import { defineParagraph } from 'prosekit/extensions/paragraph'
import { definePlaceholder } from 'prosekit/extensions/placeholder'
import { defineText } from 'prosekit/extensions/text'
import { splitBlock } from 'prosekit/pm/commands'
import type { ProseMirrorNode } from 'prosekit/pm/model'
import type { EditorView } from 'prosekit/pm/view'
import { ProseKit, useDocChange, useExtension } from 'prosekit/react'
import { useEffect, useImperativeHandle, useMemo } from 'react'
import type { Ref } from 'react'
import { getUserAgentSummary } from 'use-chat-submit'

export interface ProseKitTextareaHandle {
    clear: () => void
    focus: () => void
}

interface ProseKitTextareaProps {
    'aria-label': string
    autoFocus?: boolean
    onChange: (value: string) => void
    onSubmit: (value: string) => void
    placeholder?: string
    ref?: Ref<ProseKitTextareaHandle>
}

const getDocumentText = (document: ProseMirrorNode) =>
    document.textBetween(0, document.content.size, '\n')

const editorExtension = union(
    defineDoc(),
    defineText(),
    defineParagraph(),
    defineBaseKeymap({ preferBlockSelection: false }),
    defineKeymap({ 'Shift-Enter': splitBlock }),
    defineHistory()
)

const ProseKitTextarea = ({
    'aria-label': ariaLabel,
    autoFocus = false,
    onChange,
    onSubmit,
    placeholder = '',
    ref,
}: ProseKitTextareaProps) => {
    const editor = useMemo(
        () =>
            createEditor({
                extension: editorExtension,
            }),
        []
    )

    const handleKeyDown = useCallbackRef(
        (view: EditorView, event: KeyboardEvent) => {
            if (
                event.repeat ||
                event.isComposing ||
                view.composing ||
                event.key === 'Process' ||
                event.key !== 'Enter'
            ) {
                return false
            }

            const userAgentSummary = getUserAgentSummary()

            if (userAgentSummary && userAgentSummary.isMobile) {
                return false
            }

            const isModifierPressed =
                userAgentSummary && userAgentSummary.isAppleDevice
                    ? event.metaKey
                    : event.ctrlKey

            if (!isModifierPressed) {
                return false
            }

            const value = getDocumentText(view.state.doc)

            if (value.trim().length > 0) {
                onSubmit(value)
            }

            return true
        }
    )

    const placeholderExtension = useMemo(
        () => definePlaceholder({ placeholder, strategy: 'doc' }),
        [placeholder]
    )
    const submitExtension = useMemo(
        () => defineKeyDownHandler(handleKeyDown),
        [handleKeyDown]
    )

    useDocChange(
        (document: ProseMirrorNode) => {
            onChange(getDocumentText(document))
        },
        { editor }
    )
    useExtension(placeholderExtension, { editor })
    useExtension(submitExtension, { editor })

    useImperativeHandle(
        ref,
        () => ({
            clear: () => {
                editor.setContent('')
            },
            focus: editor.focus,
        }),
        [editor]
    )

    useEffect(() => {
        if (autoFocus) {
            editor.focus()
        }
    }, [autoFocus, editor])

    return (
        <ProseKit editor={editor}>
            <Box
                aria-label={ariaLabel}
                aria-multiline="true"
                aria-placeholder={placeholder}
                className="max-h-[10lh] min-h-lh w-full min-w-0 overflow-y-auto outline-none [&_p]:m-0"
                fz="md"
                lh="md"
                ref={editor.mount}
                role="textbox"
            />
        </ProseKit>
    )
}

export default ProseKitTextarea
