import { db } from '../../config/db.js';
import { Prisma } from '@prisma/client';

export class MemberEconomyRepository {

    /**
     * Créer un membre si il n'existe pas avec les valeurs par défaut, sinon le retourner
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} startingCredit - Le crédit de départ
     * @returns {Promise<Object>} - L'économie du membre trouvé ou créé
     */
    static async upsertMemberEconomy(memberId, guildId, startingCredit) {
        return await db.memberEconomy.upsert({
            where: { memberId_guildId: { memberId, guildId } },
            update: {},
            create: { memberId, guildId, credit: startingCredit }
        })
    }

    /**
     * Récupère le crédit d'un utilisateur dans un serveur spécifique
     * @param {string} userId - L'identifiant de l'utilisateur
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<number|null>} - Le crédit de l'utilisateur
     */
    static async findMemberCreditByGuildId(userId, guildId) {
        return await db.memberEconomy.findUnique({
            where: { memberId_guildId: { memberId: userId, guildId } },
            select: { credit: true }
        });
    }

    /**
    * Incrémente ou décrémente le crédit d'un membre
    * @param {string} userId - L'identifiant de l'utilisateur
    * @param {string} guildId - L'identifiant du serveur
    * @param {number} amount - Le montant à ajouter (positif) ou retirer (négatif)
    * @returns {Promise<Object>} - L'utilisateur mis à jour
    */
    static async updateMemberCredit(userId, guildId, amount) {
        try {
            const updateMember = await db.memberEconomy.update({
                where: { memberId_guildId: { memberId: userId, guildId}, credit: { gte: -amount } },
                data: { credit: { increment: amount}}
            })
            return updateMember;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new Error('INSUFFICIENT_FUNDS');
            } else {
                throw error;
            }
        }
    }

    /**
     * Met à jour la date de dernière réclamation quotidienne d'un membre et incrémente son crédit avec la récompense quotidienne
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} dailyAmount - La récompense quotidienne à ajouter au crédit du membre
     * @returns {Promise<Object>} - L'utilisateur mis à jour
     */
    static async claimDaily(memberId, guildId, dailyAmount) {
        return await db.memberEconomy.update({
            where: { memberId_guildId: { memberId, guildId } },
            data: {
                credit: { increment: dailyAmount },
                lastDaily: new Date()
            }
        })
    }

    /**
     * Transfère des crédits d'un membre à un autre
     * @param {string} senderId - L'identifiant de l'expéditeur
     * @param {string} receiverId - L'identifiant du destinataire
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} amount - Le montant à transférer
     * @returns {Promise<Object>} - Les informations de la transaction
     */
    static async transferCredits(senderId, receiverId, guildId, amount) {
        try {
            const result = await db.$transaction(async (tx) => {
                const sender = await tx.memberEconomy.update({
                    where: { memberId_guildId: { memberId: senderId, guildId }, credit: { gte: amount } },
                    data: {
                         credit: { decrement: amount },
                    }
                });
                const receiver = await tx.memberEconomy.update({
                    where: { memberId_guildId: { memberId: receiverId, guildId } },
                    data: {
                        credit: { increment: amount },
                    }
                })
                return { senderCredit: sender.credit, receiverCredit: receiver.credit };
            })

            return result;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new Error('INSUFFICIENT_FUNDS');
            } else {
                throw error;
            }
        }
    }
}