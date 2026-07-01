import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { Streamdown } from 'streamdown'
import type { PluginConfig } from 'streamdown'

interface MessageResponseProps {
    markdown: string
    streaming: boolean
}

const streamdownPlugins: PluginConfig = { cjk, code, math, mermaid }

const MessageResponse = ({ markdown, streaming }: MessageResponseProps) => (
    <Streamdown
        isAnimating={streaming}
        mode={streaming ? 'streaming' : 'static'}
        plugins={streamdownPlugins}
        animated
    >
        {markdown}
    </Streamdown>
)

export default MessageResponse
