import { PrismaClient } from '../generated/prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Use Prisma Accelerate URL for faster connections in production
    // Falls back to direct connection if not available
    ...(process.env.PRISMA_DATABASE_URL && {
      datasources: {
        db: {
          url: process.env.PRISMA_DATABASE_URL
        }
      }
    })
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
