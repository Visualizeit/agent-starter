# 文件附件分阶段接入方案

## 状态

- [x] 阶段 1：本地存储与后端接口
- [x] 阶段 2：已有会话上传 UI
- [x] 阶段 3：附件与消息关联
- [ ] 阶段 4：Agent 读取文本文件（暂缓）
- [ ] 阶段 5：PDF、Word、Excel 解析
- [ ] 阶段 6：对象存储与完整生命周期

## 当前方案

以 KISS 为目标，使用 Files SDK Gateway、`fs` adapter 和应用数据库附件表。Gateway 处理上传、下载、文件大小限制、随机 key 和临时 token；应用接口处理附件登记、删除与消息关联。暂不增加 Agent 工具和多 provider 配置。

存储结构：

```text
.data/uploads/{conversationId}/{random-key}.{extension}
.data/uploads/{conversationId}/{random-key}.{extension}.meta.json
```

Gateway 根据 `x-conversation-id` 将文件限制在对应 conversation prefix 中。文件 key 由 Gateway 生成，不使用原始文件名。

## 阶段 1：本地存储与后端接口

已完成：

- 安装并配置 `files-sdk/fs`。
- 增加 `FILE_STORAGE_DIRECTORY`，默认 `.data/uploads`。
- 增加 `FILE_UPLOAD_MAX_BYTES`，默认 20 MB。
- 将 `.data` 加入 `.gitignore`。
- 使用 Files SDK Gateway 处理上传和下载，应用接口处理删除。
- 校验 `x-conversation-id` 存在。
- 校验 conversation 存在且未删除。
- 使用 conversation ID 作为 Gateway `keyPrefix`。
- 限制 Gateway 操作为 `upload` 和 `download`。
- 使用 Gateway `maxUploadSize` 限制文件大小。

接口：

```text
GET  /api/files
POST /api/files
PUT  /api/files
```

客户端通过 Files SDK Client 调用，不直接拼接 Gateway 协议：

```ts
const files = createFilesClient({
    endpoint: '/api/files',
    headers: {
        'x-conversation-id': conversationId,
    },
})

const uploadedFile = await files.upload(file)
```

上传成功返回：

```json
{
    "key": "random-key.md",
    "size": 1024,
    "type": "text/markdown"
}
```

## 阶段 2：已有会话上传 UI

目标：用户可以在已有 conversation 中选择并上传单个文件。

已完成：

- 在 `PromptInput` 增加附件按钮，使用 Mantine `FileButton` 选择文件。
- 使用 `useFiles` 连接 `/api/files`。
- 在 `bottomSection` 使用 `Scroller` 展示附件。
- 显示上传中、成功和失败状态。
- 支持通过 `attachment.delete` 在发送前删除附件。
- 上传期间禁用发送。
- 第一版每条消息只允许一个文件。

验收标准：

- 已有会话可以上传文件。
- 上传失败可以重试。
- 删除附件会同时清理本地对象和数据库记录。
- 此阶段文件尚不发送给 Agent。

## 阶段 3：附件与消息关联

目标：使用应用数据库保存附件，并通过 Flue `submissionId` 与用户消息建立稳定关联。消息正文保持纯文本。

数据模型：

```text
attachments
├── id                text primary key
├── conversation_id   text not null
├── submission_id     text null
├── storage_key       text not null
├── filename          text not null
├── idempotency_key   text null
├── mime_type         text not null
├── size              integer not null
├── status            pending | attached
└── created_at        timestamp not null
```

约束和索引：

- `conversation_id` 外键关联 `conversations.id`。
- 唯一约束：`conversation_id + storage_key`。
- 索引：`conversation_id + submission_id`。
- `submission_id` 使用 Flue 投递回执中的稳定 ID；历史用户消息也携带该字段。

后端工作项：

- [x] 增加 `attachment.register`：根据 `conversationId + key` 调用 Files SDK `head()` 验证真实元数据，再创建 `pending` 记录。
- [x] 增加 `attachment.list`：返回 conversation 下已关联的附件。
- [x] 增加 `attachment.delete`：统一删除存储对象和数据库记录。
- [x] 增加 `conversation.createDraft`：只创建 conversation，不发送消息。
- [x] 增加 `conversation.send`：验证 attachment ID 归属，使用幂等 key 投递 Flue，取得 `submissionId` 后将附件更新为 `attached`。
- [x] 消息正文不写入附件 JSON，不复制 Flue messages 表。

前端工作项：

- [x] 已有会话上传完成后调用 `attachment.register`。
- [x] 发送消息时提交 attachment ID，由 `conversation.send` 统一关联。
- [x] 根据 `message.submissionId` 将附件卡片渲染到对应用户消息。
- [x] 使用 Files SDK `download()` 与 `file-saver` 保存附件。
- [x] 发送成功后清空附件状态。
- [x] 新会话先本地选择文件，提交时依次创建 draft、上传、注册、发送、导航。

验收标准：

- 刷新页面后附件卡片仍存在。
- 消息正文和复制内容不包含内部附件数据。
- 点击附件可以下载。
- 删除附件同时清理对象和数据库记录。
- 重试相同发送请求不会产生重复 Flue 消息或重复关联。
- 新会话首条消息支持附件。
- 不带附件的历史消息不受影响。

## 阶段 4：Agent 读取文本文件（暂缓）

目标：Agent 能读取文本、代码、JSON、CSV 和 Markdown。

工作项：

- 增加 `read_attachment` Flue 工具。
- 工具只接受附件 `id`，不直接接受存储 key。
- 后端根据当前 conversation 验证附件归属并解析存储 key。
- 使用 `TextDecoder` 提取文本。
- 限制单次返回长度。

## 阶段 5：PDF、Word、Excel 解析

建议顺序：

1. PDF：`unpdf`。
2. DOCX：`mammoth`。
3. XLSX：按工作表转换为结构化文本。

仅在文本文件流程稳定后实施。

## 阶段 6：对象存储与完整生命周期

目标：在需要 SaaS 能力时切换真实对象存储。

工作项：

- `fs` adapter 替换为 S3、Alibaba OSS 或 R2 adapter，Gateway 自动改用签名直传。
- 配置稳定的 `FILES_API_SECRET`。
- 为附件增加 tenant 归属。
- 支持多文件、上传进度和取消。
- 清理孤儿文件和永久删除的 conversation 附件。

保持不变：

- 附件 key
- attachment API 和关联模型
- 后续 Agent 工具接口
