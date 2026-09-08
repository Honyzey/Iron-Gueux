import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

import 'dotenv/config.js';

import Fastify from "fastify";
import { db } from "./config/db.js";

import { guildController } from "./modules/guild/guild.controller.js";
import { economyController } from "./modules/economy/economy.controller.js";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;

const fastify = Fastify({
  logger: true,
});

// Configuration de Swagger
await fastify.register(fastifySwagger, {
    openapi: {
        info: {
            title: "Iron Gueux API",
            description: "API centrale pour le bot, le dashboard et l'acrivité",
            version: "1.0.0"
        }
    }
});

await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
})

// Définition des routes
fastify.register(guildController, { prefix: "/guilds" });
fastify.register(economyController, { prefix: "/economy" });
fastify.get("/health", async (request, reply) => {
    return { status: "ok" };
});

// 1. La fonction qui contient LA séquence de fermeture
const handleShutdown = async (signal) => {
    fastify.log.info(`Signal ${signal} recu. Fermeture de l'API...`);
    
    try {
        await fastify.close();      // Étape 1 : Stop Fastify
        await db.$disconnect();     // Étape 2 : Stop Prisma
        fastify.log.info("Serveur et BDD arretes proprement.");
        process.exit(0);           // Succès
    } catch (err) {
        fastify.log.error("Erreur lors de la fermeture :", err);
        process.exit(1);           // Échec
    }
};

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

start();