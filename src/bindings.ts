export type Bindings = {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_APPLICATION_APP: string;
  GAS_URL: string;
};

declare global {
  function getMiniflareBindings(): Bindings;
}
