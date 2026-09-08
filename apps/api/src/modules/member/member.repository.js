import { db } from '../../config/db.js';

export class MemberRepository {

    /**
     * Créer un membre si il n'existe pas sinon le retourner
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - Le membre trouvé ou créé
     */
    static async upsertMemberByGuildId(memberId, guildId) {
        return await db.member.upsert({
            where: { id_guildId: { id: memberId, guildId } },
            update: {},
            create: { id: memberId, guildId }
        });
    }

    //jsdoc findMemberByBuildId
    /**
     * Cherche un membre dans la base de données par son identifiant et l'identifiant du serveur
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object|null>} - Le membre trouvé ou null si le membre n'existe pas
     */
    static async findMemberByGuildId(memberId, guildId) {
        return await db.member.findUnique({
            where: { id_guildId: { id: memberId, guildId } }
        });
    }

}