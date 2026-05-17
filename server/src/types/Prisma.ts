import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

const connectionString = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: connectionString,
});

const adapter = new PrismaPg(pool as any);

export const prisma = new PrismaClient({ adapter });