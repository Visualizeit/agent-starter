import { os } from "@orpc/server";

import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>().errors({
  CONFLICT: {
    message: "Conflict",
  },
  NOT_FOUND: {
    message: "Not found",
  },
});

export default base;
