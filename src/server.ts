import {
  APIInteraction,
  APIInteractionResponse,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { Hono } from "hono";
import { Bindings } from "./bindings";
import { DOI_COMMAND } from "./commands";
import { createDOIResponseMessage } from "./message";
import { getApplicationId } from "./utils";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  return c.text(`Hello ${getApplicationId(c.env.DISCORD_BOT_TOKEN)}`);
});

app.post("/", async (c) => {
  // verify
  const signature = c.req.header("x-signature-ed25519");
  const timestamp = c.req.header("x-signature-timestamp");
  const body = await c.req.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return c.text("Bad request signature.", 401);
  }

  const interaction: APIInteraction = JSON.parse(body);
  if (!interaction) {
    return c.text("Bad request signature.", 401);
  }

  // interact
  if (interaction.type === InteractionType.Ping) {
    return c.json<APIInteractionResponse>({
      type: InteractionResponseType.Pong,
    });
  }

  if (
    interaction.type === InteractionType.ApplicationCommand &&
    interaction.data.type === ApplicationCommandType.ChatInput
  ) {
    switch (interaction.data.name.toLowerCase()) {
      case DOI_COMMAND.name.toLowerCase(): {
        try {
          c.executionCtx.waitUntil(
            createDOIResponseMessage(interaction, c.env),
          );
          return c.json<APIInteractionResponse>({
            type: InteractionResponseType.DeferredChannelMessageWithSource,
          });
        } catch (e) {
          return c.json<APIInteractionResponse>({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: `エラー\n${e}`,
            },
          });
        }
      }
      default:
        return c.json({ error: "Unknown Type" }, 400);
    }
  }

  console.error("Unknown Type");
  return c.json({ error: "Unknown Type" }, 400);
});

app.post("/callback", async (c) => {
  const { interactionToken, content } = await c.req.json();
  if (!interactionToken || !content) {
    return c.json({ error: "interactionToken or content is undefined." }, 400);
  }

  const DISCORD_ENDPOINT = "https://discord.com/api/v10/webhooks";
  try {
    const res = await fetch(
      `${DISCORD_ENDPOINT}/${c.env.DISCORD_APPLICATION_APP}/${interactionToken}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}`,
          "User-Agent": "DiscordBot (xxxxxxxx, 9)",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      },
    );
    return c.json(await res.json());
  } catch (e) {
    return c.text(`${e}`, 500);
  }
});

app.fire();

export default app;
