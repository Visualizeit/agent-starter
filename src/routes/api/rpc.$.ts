import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";

import createORPCContext from "@/server/orpc/context";
import router from "@/server/orpc/router";

const handler = new RPCHandler(router);

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await handler.handle(request, {
          context: createORPCContext(),
          prefix: "/api/rpc",
        });

        return response ?? new Response("Not Found", { status: 404 });
      },
    },
  },
});
