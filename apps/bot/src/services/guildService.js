import { db } from '../lib/db.js';

export class GuildService {

    // Méthode statique pour récupérer ou créer la configuration de l'économie du serveur
    static async getOrCreateGuildEconomyConfig(guildId) {

        const config = await db.guildEconomyConfig.upsert({
            where: { guildId },
            update: {},
            create: {
                guild: {
                    connectOrCreate: {
                        where: { id: guildId },
                        create: { id: guildId }
                    }
                }
            }
        });

        return config;

    }

}