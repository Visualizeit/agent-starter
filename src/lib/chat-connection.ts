import { fetchServerSentEvents } from '@tanstack/ai-react'

const chatConnection = fetchServerSentEvents('/api/chat')

export default chatConnection
