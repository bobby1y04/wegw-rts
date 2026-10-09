import { config } from "dotenv";

export function loadLocalEnvironment(): void {
  if (!process.env.DATABASE_URL) {
    config({ path: ".env.local", quiet: true });
  }
}
