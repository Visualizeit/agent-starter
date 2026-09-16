import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { invariant } from 'es-toolkit/util'
import { harden } from 'rehype-harden'
import { defaultRehypePlugins, Streamdown } from 'streamdown'
import type { PluginConfig, StreamdownProps } from 'streamdown'

interface MessageResponseProps {
    markdown: string
    isStreaming?: boolean
}

const streamdownPlugins: PluginConfig = { cjk, code, math, mermaid }

const streamdownDisallowedElements: StreamdownProps['disallowedElements'] = [
    'img',
]

const sanitizePlugin = defaultRehypePlugins.sanitize

invariant(sanitizePlugin, 'Streamdown sanitize plugin is required')

const streamdownRehypePlugins: StreamdownProps['rehypePlugins'] = [
    sanitizePlugin,
    [
        harden,
        {
            allowDataImages: false,
            allowedImagePrefixes: [],
            allowedLinkPrefixes: ['*'],
            allowedProtocols: ['http', 'https', 'mailto'],
        },
    ],
]

const MessageResponse = ({
    markdown,
    isStreaming = false,
}: MessageResponseProps) => (
    <Streamdown
        disallowedElements={streamdownDisallowedElements}
        isAnimating={isStreaming}
        mode={isStreaming ? 'streaming' : 'static'}
        plugins={streamdownPlugins}
        rehypePlugins={streamdownRehypePlugins}
        skipHtml
    >
        {markdown}
    </Streamdown>
)

export default MessageResponse
