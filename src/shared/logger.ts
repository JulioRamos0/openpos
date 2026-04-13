import { appendFileSync } from "fs";

export function logKey(input: string, key: any) {
  const line = `${new Date().toISOString()} | input: ${JSON.stringify(input)} | name: ${(key as any).name} | key: ${JSON.stringify(key)}\n`;
  appendFileSync("keylog.txt", line);
}