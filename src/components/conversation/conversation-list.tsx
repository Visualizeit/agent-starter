import { Box } from "@mantine/core";
import { useSuspenseQuery } from "@tanstack/react-query";

import orpc from "@/lib/orpc";

import ConversationListItem from "./conversation-list-item";

const ConversationList = () => {
  const { data: conversations } = useSuspenseQuery(
    orpc.conversation.list.queryOptions({
      input: { status: "active" },
      select: (data) => data.list,
    }),
  );

  return (
    <Box component="ul">
      {conversations.map((conversation) => (
        <ConversationListItem conversation={conversation} key={conversation.id} />
      ))}
    </Box>
  );
};

export default ConversationList;
