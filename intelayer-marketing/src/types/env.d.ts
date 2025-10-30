interface ImportMetaEnv {
  readonly VITE_TRADE_URL?: string;
  readonly VITE_DISCORD_URL?: string;
  readonly VITE_TWITTER_URL?: string;
  readonly VITE_TELEGRAM_URL?: string;
  readonly VITE_YOUTUBE_URL?: string;
  readonly VITE_GITHUB_URL?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
