import { z } from "zod";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";

const requestSchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user._id;
    // Use empty string if key not set — Convex backend bypasses validation gracefully
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY || "";

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { prompt } = requestSchema.parse(body);

    // Generate a random project name
    const projectName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors],
      separator: "-",
      length: 3,
    });

    // Create project and conversation together
    const { projectId, conversationId } = await convex.mutation(
      api.system.createProjectWithConversation,
      {
        internalKey,
        projectName,
        conversationTitle: DEFAULT_CONVERSATION_TITLE,
        ownerId: userId,
      },
    );

    // Create user message
    await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId,
      projectId,
      role: "user",
      content: prompt,
    });

    // Create assistant message placeholder with processing status
    const assistantMessageId = await convex.mutation(
      api.system.createMessage,
      {
        internalKey,
        conversationId,
        projectId,
        role: "assistant",
        content: "",
        status: "processing",
      },
    );

    // Trigger Inngest to process the message
    await inngest.send({
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
        conversationId,
        projectId,
        message: prompt,
      },
    });

    return NextResponse.json({ projectId });
  } catch (error: any) {
    console.error("Create project error:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack?.split("\n")[0],
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? "SET" : "MISSING",
      internalKey: process.env.POLARIS_CONVEX_INTERNAL_KEY ? "SET" : "MISSING",
    });
    return NextResponse.json(
      { error: error?.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

