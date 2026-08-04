import { Files } from 'files-sdk'
import { fs } from 'files-sdk/fs'

import serverEnv from '@/server/server-env'

const files = new Files({
    adapter: fs({
        root: serverEnv.FILE_STORAGE_DIRECTORY,
    }),
})

export default files
