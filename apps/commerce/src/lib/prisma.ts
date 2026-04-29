import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

/**
 * Singleton: Get or create PrismaClient instance.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Disconnect Prisma client (cleanup).
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
