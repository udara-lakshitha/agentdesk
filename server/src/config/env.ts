import "dotenv/config";

function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  isProduction: process.env.NODE_ENV === "production",
};