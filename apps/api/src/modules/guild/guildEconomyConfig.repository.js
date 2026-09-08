import { db } from '../../config/db.js';

export class GuildEconomyConfigRepository {

    /**
     * Cherche ou créer un serveur dans la base de données
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - La configuration d'économie du serveur trouvée ou créée
     */
    static async upsertGuildEconomyConfig(guildId) {
        return await db.guildEconomyConfig.upsert({
            where: { guildId: guildId },
            update: {},
            create: { guildId: guildId }
        });
    }

    /**
     * Cherche une configuration d'économie de serveur dans la base de données
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object|null>} - La configuration d'économie du serveur trouvée ou null si elle n'existe pas
     */
    static async findGuildEconomyConfigByGuildId(guildId) {
        return await db.guildEconomyConfig.findUnique({
            where: { guildId: guildId }
        });
    }

    /**
     * Synchronise les configurations d'économie de serveur dans la base de données et ignore les doublons
     * @param {Array<string>} guildIds - Les identifiants des serveurs à synchroniser
     * @returns {Promise<void>}
     */
    static async syncGuildEconomyConfigs(guildIds) {
        return await db.guildEconomyConfig.createMany({
            data: guildIds.map(id => ({ guildId: id })),
            skipDuplicates: true
        });
    }

}