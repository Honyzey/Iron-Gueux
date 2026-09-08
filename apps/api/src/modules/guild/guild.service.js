import { GuildRepository } from './guild.repository.js';
import { GuildEconomyConfigRepository } from './guildEconomyConfig.repository.js';

export class GuildService {

    /**
     * Crée un serveur dans la base de données avec ses configurations et retourne le serveur créé (ou trouvé si il existait déjà)
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - Le serveur trouvé ou créé avec ses configurations
     */
    static async createGuildById(guildId) {
        const guild = await GuildRepository.upsertGuild(guildId);
        await GuildEconomyConfigRepository.upsertGuildEconomyConfig(guildId);

        return guild ;
    }

    /**
     * Synchronise les serveurs dans la base de données et leurs configurations et crée les serveurs et configurations manquants
     * @param {Array<string>} guildIds - Les identifiants des serveurs à synchroniser
     * @returns {Promise<void>}
     */
    static async syncGuilds(guildIds) {
        const result = await GuildRepository.syncGuilds(guildIds);
        await GuildEconomyConfigRepository.syncGuildEconomyConfigs(guildIds);

        return result.count;
    }
    
    /**
     * Cherche un serveur dans la base de données avec ses configurations
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object|null>} - Le serveur trouvé avec ses configurations ou null si le serveur n'existe pas
     */
    static async getGuildById(guildId) {
        const guild = await GuildRepository.findGuildById(guildId);
        if (!guild) {
            throw new Error('GUILD_NOT_FOUND');
        }
        return guild;
    }
}