import { MemberEconomyRepository } from './memberEconomy.repository.js';
import { MemberRepository } from '../member/member.repository.js'
import { GuildService } from '../guild/guild.service.js';

export class EconomyService {

    /**
     * Vérifie si l'économie d'un membre existe dans un serveur spécifique, sinon la crée avec le crédit de départ défini dans la configuration du serveur
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - L'économie du membre trouvée ou créée
     */
    static async ensureMemberEconomyExists(memberId, guildId) {
        // Vérifie si le serveur existe, sinon retourne une erreur
        const guild = await GuildService.getGuildById(guildId);

        // Crée le membre dans la base de données s'il n'existe pas déjà
        await MemberRepository.upsertMemberByGuildId(memberId, guildId);

        // Crée l'économie du membre avec le crédit de départ défini dans la configuration du serveur
        const startingCredit = guild.economyConfig.startingCredit;
        return await MemberEconomyRepository.upsertMemberEconomy(memberId, guildId, startingCredit);
    }

    /**
     * Incrémente le crédit d'un membre dans un serveur spécifique
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} amount - Le montant à ajouter (positif) ou retirer (négatif)
     * @returns {Promise<Object>} - Le membre mis à jour avec son nouveau crédit
     */
    static async incrementMemberCredit(memberId, guildId, amount) {
        return await MemberEconomyRepository.updateMemberCredit(memberId, guildId, amount);
    }

    /**
     * Décrémente le crédit d'un membre dans un serveur spécifique
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} amount - Le montant à retirer (positif)
     * @returns {Promise<Object>} - Le membre mis à jour avec son nouveau crédit
     */
    static async decrementMemberCredit(memberId, guildId, amount) {
        return await MemberEconomyRepository.updateMemberCredit(memberId, guildId, -amount);
    }

    /**
     * Récupère le crédit d'un membre dans un serveur spécifique
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<number>} - Le crédit du membre
     */
    static async getMemberCredit(memberId, guildId) {
        const member = await MemberEconomyRepository.findMemberCreditByGuildId(memberId, guildId);
        if (!member) {
            throw new Error('MEMBER_ECONOMY_NOT_FOUND');
        }
        return member.credit;
    }

    /**
     * Permet à un membre de réclamer sa récompense quotidienne dans un serveur spécifique
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - Les informations de la récompense quotidienne
     */
    static async claimDailyReward(memberId, guildId) {
        const member = await this.ensureMemberEconomyExists(memberId, guildId);
        
        const today = new Date().toDateString();
        const hasClaimedToday = member.lastDaily && member.lastDaily.toDateString() === today;

        if (hasClaimedToday) {
            const nextMidnight = new Date();
            nextMidnight.setHours(24, 0, 0, 0); // Définit l'heure à minuit
            const msRemaining = nextMidnight.getTime() - Date.now();

            const error = new Error('DAILY_REWARD_ALREADY_CLAIMED');
            error.msRemaining = msRemaining;
            throw error;
        }

        const guild = await GuildService.getGuildById(guildId);
        const dailyRewardAmount = guild.economyConfig.dailyAmount;

        const result = await MemberEconomyRepository.claimDaily(memberId, guildId, dailyRewardAmount);

        return { credit: result.credit, DailyRewardAmount: dailyRewardAmount };
    }

    //jsdoc claimWork
    /**
     * Permet à un membre de réclamer sa récompense de travail dans un serveur spécifique
     * @param {string} memberId - L'identifiant du membre
     * @param {string} guildId - L'identifiant du serveur
     * @returns {Promise<Object>} - Les informations de la récompense de travail
     */
    static async claimWork(memberId, guildId) {
        await this.ensureMemberEconomyExists(memberId, guildId);

        const guild = await GuildService.getGuildById(guildId);
        const minWorkAmount = guild.economyConfig.workMin;
        const maxWorkAmount = guild.economyConfig.workMax;

        const randomWorkAmount = Math.floor(Math.random() * (maxWorkAmount - minWorkAmount + 1)) + minWorkAmount;

        const result = await this.incrementMemberCredit(memberId, guildId, randomWorkAmount);

        return { credit: result.credit, workRewardAmount: randomWorkAmount };
    }

    /**
     * Transfère des crédits d'un membre à un autre dans un serveur spécifique
     * @param {string} senderId - L'identifiant du membre expéditeur
     * @param {string} receiverId - L'identifiant du membre destinataire
     * @param {string} guildId - L'identifiant du serveur
     * @param {number} amount - Le montant à transférer
     * @returns {Promise<Object>} - Les informations de la transaction
     */
    static async transferCredits(senderId, receiverId, guildId, amount) {
        // Vérifie si l'économie du membre expéditeur existe
        const sender = await MemberEconomyRepository.findMemberCreditByGuildId(senderId, guildId);
        // Si l'économie du membre expéditeur n'existe pas alors il peut pas transférer de crédits, on retourne une erreur
        if (!sender) {
            throw new Error('SENDER_NOT_FOUND');
        }

        // Vérifie si l'économie du membre destinataire existe, sinon la crée avec le crédit de départ défini dans la configuration du serveur
        await this.ensureMemberEconomyExists(receiverId, guildId);

        return await MemberEconomyRepository.transferCredits(senderId, receiverId, guildId, amount);
    }
}