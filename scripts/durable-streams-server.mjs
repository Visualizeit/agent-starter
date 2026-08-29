import path from 'node:path'

import { DurableStreamTestServer } from '@durable-streams/server'

const durableStreamsServer = new DurableStreamTestServer({
    dataDir: path.resolve('.data/durable-streams'),
    host: '127.0.0.1',
    port: 4437,
})

const serverUrl = await durableStreamsServer.start()

console.log(`Durable Streams server running on ${serverUrl}`)

const stopServer = async () => {
    await durableStreamsServer.stop()
    process.exit(0)
}

process.once('SIGINT', () => {
    void stopServer()
})
process.once('SIGTERM', () => {
    void stopServer()
})
