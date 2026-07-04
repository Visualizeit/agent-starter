import { ActionIcon, Box, Menu, Text, UnstyledButton } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArchiveIcon, MoreHorizontalIcon } from "lucide-react";

import orpc from "@/lib/orpc";
import { cn } from "@/lib/utils";
import type { conversations } from "@/server/db/schema";

interface ConversationListItemProps {
  conversation: typeof conversations.$inferSelect;
}

const ConversationListItem = ({ conversation }: ConversationListItemProps) => {
  const label = conversation.title ?? "New Chat";

  const navigate = useNavigate();

  const archiveConversationMutation = useMutation(
    orpc.conversation.update.mutationOptions({
      onSuccess: async (_updatedConversation, _variables, _onMutateResult, context) => {
        await navigate({ to: "/" });

        await context.client.invalidateQueries(
          orpc.conversation.list.queryOptions({
            input: { status: "active" },
          }),
        );
      },
    }),
  );

  const handleArchive = async () => {
    await archiveConversationMutation.mutateAsync({
      id: conversation.id,
      status: "archived",
    });
  };

  return (
    <Box
      component="li"
      className={cn(
        "group/menu-item relative list-none",
        "rounded-(--mantine-radius-md)",
        "hover:bg-(--mantine-color-gray-light-hover) focus-within:bg-(--mantine-color-gray-light-hover)",
      )}
    >
      <UnstyledButton
        data-sidebar="menu-button"
        className={cn(
          "block w-full min-w-0",
          "rounded-(--mantine-radius-md) p-(--mantine-spacing-xxs)",
          "aria-[current=page]:bg-(--mantine-color-gray-light-hover)",
          "group-hover/menu-item:pr-[calc(var(--mantine-spacing-xxs)+1.75rem)] group-focus-within/menu-item:pr-[calc(var(--mantine-spacing-xxs)+1.75rem)]",
        )}
        renderRoot={(props) => (
          <Link to="/$conversationId" params={{ conversationId: conversation.id }} {...props}>
            <Text size="sm" truncate>
              {label}
            </Text>
          </Link>
        )}
      />
      <Menu position="bottom-start">
        <Menu.Target>
          <ActionIcon
            data-sidebar="menu-action"
            variant="transparent"
            color="gray"
            size="sm"
            aria-label="Conversation actions"
            className={cn(
              "invisible absolute right-(--mantine-spacing-xxs) top-1/2 -translate-y-1/2",
              "group-hover/menu-item:visible group-focus-within/menu-item:visible",
            )}
          >
            <MoreHorizontalIcon className="size-4" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            disabled={archiveConversationMutation.isPending}
            leftSection={<ArchiveIcon className="size-4" />}
            onClick={handleArchive}
          >
            Archive
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
};

export default ConversationListItem;
