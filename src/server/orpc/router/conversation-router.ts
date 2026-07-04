import { eq } from "drizzle-orm";
import { isNil } from "es-toolkit/predicate";
import { nanoid } from "nanoid";
import { z } from "zod";

import database from "@/server/db/client";
import { conversations } from "@/server/db/schema";

import base from "../base";

const idSchema = z.string().min(1);
const messageSchema = z.string().trim().min(1);
const titleSchema = z.string().max(200).nullable();
const modelSchema = z.string().max(120).nullable();
const metadataSchema = z.record(z.string(), z.json());
const statusSchema = z.enum(["active", "archived", "deleted"]);

const conversationRouter = {
  create: base
    .input(z.object({ message: messageSchema }))
    .handler(async ({ input, context, errors }) => {
      const conversationId = nanoid();

      const [createdConversation] = await database
        .insert(conversations)
        .values({
          id: conversationId,
        })
        .onConflictDoNothing({ target: conversations.id })
        .returning();

      if (isNil(createdConversation)) {
        throw errors.CONFLICT();
      }

      await context.flue.agents.send("assistant", conversationId, {
        message: input.message,
      });

      return createdConversation;
    }),
  delete: base.input(z.object({ id: idSchema })).handler(async ({ errors, input }) => {
    const [deletedConversation] = await database
      .update(conversations)
      .set({
        status: "deleted",
      })
      .where(eq(conversations.id, input.id))
      .returning();

    if (isNil(deletedConversation)) {
      throw errors.NOT_FOUND();
    }

    return deletedConversation;
  }),
  find: base.input(z.object({ id: idSchema })).handler(async ({ errors, input }) => {
    const conversationRecord = await database.query.conversations.findFirst({
      where: {
        id: input.id,
      },
    });

    if (isNil(conversationRecord)) {
      throw errors.NOT_FOUND();
    }

    return conversationRecord;
  }),
  list: base
    .input(
      z.object({
        status: statusSchema,
      }),
    )
    .handler(async ({ input }) => {
      const records = await database.query.conversations.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          status: input.status,
        },
      });

      return { list: records };
    }),
  update: base
    .input(
      z.object({
        id: idSchema,
        metadata: metadataSchema.optional(),
        model: modelSchema.optional(),
        status: statusSchema.exclude(["deleted"]).optional(),
        title: titleSchema.optional(),
      }),
    )
    .handler(async ({ input, errors }) => {
      const [updatedConversation] = await database
        .update(conversations)
        .set({
          metadata: input.metadata,
          model: input.model,
          status: input.status,
          title: input.title,
        })
        .where(eq(conversations.id, input.id))
        .returning();

      if (isNil(updatedConversation)) {
        throw errors.NOT_FOUND();
      }

      return updatedConversation;
    }),
};

export default conversationRouter;
