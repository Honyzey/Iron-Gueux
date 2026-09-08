import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Création du pool de connexion PostgreSQL
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Initialisation de l'adaptateur Prisma pour PostgreSQL
const adapter = new PrismaPg(pool);

// Instanciation du client Prisma avec l'adaptateur PostgreSQL
export const db = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});