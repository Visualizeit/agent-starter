import { Box, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import NewConversationPromptInput from "@/components/chat/new-conversation-prompt-input";

const Component = () => (
  <Stack className="size-full absolute" gap={0}>
    <Box className="flex-1 overflow-hidden"></Box>
    <Box className="container mx-auto max-w-3xl" pb="md">
      <NewConversationPromptInput />
    </Box>
  </Stack>
);

export const Route = createFileRoute("/")({
  component: Component,
});
