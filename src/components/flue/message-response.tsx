import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { Streamdown } from 'streamdown'
import type { PluginConfig } from 'streamdown'

interface MessageResponseProps {
    markdown: string
}

const streamdownPlugins: PluginConfig = { cjk, code, math, mermaid }

const MessageResponse = ({ markdown }: MessageResponseProps) => (
    <Streamdown plugins={streamdownPlugins}>{markdown}</Streamdown>
)

export default MessageResponse
