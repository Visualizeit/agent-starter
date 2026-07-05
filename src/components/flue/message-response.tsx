import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { Streamdown } from 'streamdown'
import type { PluginConfig } from 'streamdown'

interface MessageResponseProps {
    markdown: string
    isStreaming?: boolean
}

const streamdownPlugins: PluginConfig = { cjk, code, math, mermaid }

const MessageResponse = ({
    markdown,
    isStreaming = false,
}: MessageResponseProps) => (
    <Streamdown
        isAnimating={isStreaming}
        mode={isStreaming ? 'streaming' : 'static'}
        plugins={streamdownPlugins}
        animated
    >
        {markdown}
    </Streamdown>
)

export default MessageResponse
