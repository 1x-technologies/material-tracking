import type { KnownBlock } from "@slack/web-api";
import { WebClient } from "@slack/web-api";
import { getSecret } from "./firebase";

let slackClient: WebClient | null = null;

export async function getSlackClient(): Promise<WebClient> {
  if (!slackClient) {
    const token = await getSecret("slack-bot-token");
    slackClient = new WebClient(token);
  }
  return slackClient;
}

export async function lookupSlackUser(
  email: string,
): Promise<string | null> {
  try {
    const client = await getSlackClient();
    const result = await client.users.lookupByEmail({ email });
    return result.user?.id ?? null;
  } catch (error: unknown) {
    const slackError = error as { data?: { error?: string } };
    if (slackError.data?.error === "users_not_found") {
      console.warn(`[slack] User not found for email: ${email}`);
    } else {
      console.error(`[slack] lookupByEmail failed for ${email}:`, error);
    }
    return null;
  }
}

export async function sendSlackDM(
  email: string,
  message: { text: string; blocks: KnownBlock[] },
): Promise<void> {
  const userId = await lookupSlackUser(email);
  if (!userId) {
    return;
  }
  try {
    const client = await getSlackClient();
    await client.chat.postMessage({
      channel: userId,
      text: message.text,
      blocks: message.blocks,
    });
  } catch (error) {
    console.error(`[slack] Failed to DM ${email}:`, error);
  }
}
