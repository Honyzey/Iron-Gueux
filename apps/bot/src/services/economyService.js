import { db } from "../lib/db.js";
import { GuildService } from "./guildService.js";

export class EconomyService {
    
    // Méthode statique pour récupérer ou créer le membre
    static async getOrCreateMember(userId, guildId) {

        // Récupération de la config du serveur
        const config = await GuildService.getOrCreateGuildEconomyConfig(guildId);

        let member = await db.member.upsert({
            where: { id_guildId: { id: userId, guildId: guildId } },
            update: {},
            create: { id: userId, guildId: guildId, credit: config.startingCredit }
        });

        return { member, config };

    }

    // Méthode statique pour lire le solde
    static async getBalance(userId, guildId) {

      const { member } = await this.getOrCreateMember(userId, guildId);
      return member.credit;

    }

    // Méthode statique pour modifier le solde
    static async updateBalance(userId, guildId, amount) {

    await this.getOrCreateMember(userId, guildId);

    const updatedMember = await db.member.update({
        where: { id_guildId: { id: userId, guildId: guildId } },
        data: { credit: { increment: amount } }
    })

    return updatedMember.credit;

    }

    // Méthode statique pour réclamer le salaire quotidien
    static async claimDaily(userId, guildId) {

        const { member, config} = await this.getOrCreateMember(userId, guildId);

        // 1. Vérification si le membre a déjà réclamé son salaire quotidien aujourd'hui
        const today = new Date().toDateString(); // Date actuelle sans l'heure
        const hasClaimedToday = member.lastDaily && member.lastDaily.toDateString() === today;

        if (hasClaimedToday) {
            const nextMidnight = new Date();
            nextMidnight.setHours(24, 0, 0, 0); // Définit l'heure à minuit
            const msRemaining = nextMidnight.getTime() - Date.now();

            return { success: false, msRemaining };
        }

        // 2. Ajout du crédit quotidien (20 crédits)
        const updatedMember = await db.member.update({
            where: { id_guildId: { id: userId, guildId: guildId } },
            data: {
                credit: { increment: config.dailyAmount },
                lastDaily: new Date() // Met à jour la date de la dernière réclamation
            }
        });

        return { success: true, newBalance: updatedMember.credit };

    }

    // Méthode statique pour travailler et gagner des crédits
    static async claimWork(userId, guildId) {

        const config = await GuildService.getOrCreateGuildEconomyConfig(guildId);
        const minWorkAmount = config.workMin; // Valeur minimale par défaut
        const maxWorkAmount = config.workMax; // Valeur maximale par défaut

        const randomAmount = Math.floor(Math.random() * (maxWorkAmount - minWorkAmount + 1)) + minWorkAmount;

        const updatedMember = await this.updateBalance(userId, guildId, randomAmount);

        return { randomAmount, updatedMember };
    }

    static async sendCredits(senderId, receiverId, guildId, amount) {

        // 1. Garde-fous immédiats (0 requête BDD)
        if (senderId === receiverId) {
            return { success: false, message: "Vous ne pouvez pas vous envoyer des crédits à vous-même." };
        }

        if (amount <= 0) {
            return { success: false, message: "Le montant doit être supérieur à zéro." };
        }

        // 2. Récupération / Création de l'expéditeur
        const { member: sender } = await this.getOrCreateMember(senderId, guildId);

        // 3. Vérification préliminaire du solde en mémoire
        if (sender.credit < amount) {
            return { success: false, message: "Vous n'avez pas assez de crédits pour effectuer ce transfert." };
        }

        // 4. Création du destinataire s'il n'existe pas
        await this.getOrCreateMember(receiverId, guildId);

        // 5. Transaction BDD atomique avec vérification stricte
        const [updateResult] = await db.$transaction([
            // A. On tente de débiter UNIQUEMENT SI credit >= amount
            db.member.updateMany({
                where: { 
                    id: senderId, 
                    guildId: guildId,
                    credit: { gte: amount } // gte = Greater Than or Equal (>=)
                },
                data: { credit: { decrement: amount } }
            }),
            // B. Crédit du destinataire
            db.member.update({
                where: { id_guildId: { id: receiverId, guildId: guildId } },
                data: { credit: { increment: amount } }
            })
        ]);

        // Si 0 ligne a été modifiée, le solde était insuffisant au moment exact de l'écriture SQL
        if (updateResult.count === 0) {
            return { success: false, message: "Transaction annulée : solde insuffisant." };
        }

        // 6. Récupération du solde mis à jour pour le retour
        const finalSender = await db.member.findUnique({
            where: { id_guildId: { id: senderId, guildId: guildId } }
        });

        return { 
            success: true, 
            message: `Vous avez envoyé ${amount} crédits à <@${receiverId}>.`,
            newBalance: finalSender.credit 
        };
    }


    /*
    Méthodes pour les jeux de casino
    */

    // Méthode statique pour déduire des crédits (utilisée pour les jeux de casino)
    static async deductBet(userId, guildId, amount) {
        // 1. Vérification du montant
        if (amount <= 0) {
            return { success: false, message: "Le montant doit être supérieur à zéro." };
        }

        // 2. Récupération / Création du membre
        await this.getOrCreateMember(userId, guildId);

        // 3. Transaction BDD atomique avec vérification stricte
        const result = await db.member.updateMany({
            where: {
                id: userId,
                guildId: guildId,
                credit: { gte: amount }
            },
            data: { credit: { decrement: amount } }
        });

        if (result.count === 0) {
            return { success: false, message: "Transaction annulée : solde insuffisant." };
        }

        return { success: true, message: `Vous avez misé ${amount} crédits.` };
    }

    // Méthode statique pour ajouter des crédits (utilisée pour les jeux de casino)
    static async addWinnings(userId, guildId, amount) {
        if (amount <= 0) {
            return { success: false, message: "Le montant doit être supérieur à zéro." };
        }

        const updatedMember = await this.updateBalance(userId, guildId, amount);

        return { success: true, message: `Vous avez gagné ${amount} crédits !`, newBalance: updatedMember };
    }

    // Méthode statique pour récupérer le solde du membre (utilisée pour les jeux de casino)
    static async refundBet(userId, guildId, amount) {
        if (amount <= 0) {
            return { success: false, message: "Le montant doit être supérieur à zéro." };
        }

        const updatedMember = await this.updateBalance(userId, guildId, amount);

        return { success: true, message: `Votre mise de ${amount} crédits a été remboursée.`, newBalance: updatedMember };
    }

}