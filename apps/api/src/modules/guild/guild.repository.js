import { db } from '../../config/db.js';

export class GuildRepository {

    /**
     * Créer un serveur si il n'existe pas sinon le retourner
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - Le serveur trouvé ou créé
     */
    static async upsertGuild(guildId) {
        return await db.guild.upsert({
            where: { id: guildId },
            update: {},
            create: { id: guildId }
        });
    }

    /**
     * Cherche un serveur dans la base de données
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object|null>} - Le serveur trouvé ou null si le serveur n'existe pas
     */
    static async findGuildById(guildId) {
        return await db.guild.findUnique({
            where: { id: guildId },
            include: { economyConfig: true } // Inclut la configuration d'économie du serveur
        });
    }

    /**
     * Synchronise les serveurs dans la base de données et ignore les doublons
     * @param {Array<string>} guildIds - Les identifiants des serveurs à synchroniser
     * @returns {Promise<void>}
     */
    static async syncGuilds(guildIds) {
        return await db.guild.createMany({
            data: guildIds.map(id => ({ id })),
            skipDuplicates: true
        });
    }

}