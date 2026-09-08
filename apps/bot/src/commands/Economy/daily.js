import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economyService.js';

export class DailyCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'daily',
            description: 'Donne ton salaire quotidien !',
            preconditions: ['GuildOnly'], // Assurez-vous que la commande est utilisée dans un serveur
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    async chatInputRun(interaction) {
        // 1. Récupération de l'utilisateur et du serveur
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        // 2. Ajout du crédit quotidien (20 crédits). Si le membre n'existe pas, il sera créé avec un crédit initial de 15 automatiquement via les méthodes de la classe EconomyService.
        const result = await EconomyService.claimDaily(userId, guildId);

        // 3. Vérification si le membre a déjà réclamé son salaire quotidien aujourd'hui
        if (!result.success) {
            const hoursRemaining = Math.ceil(result.msRemaining / (1000 * 60 * 60));

            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⏳ Salaire quotidien déjà réclamé !')
                .setDescription(`Vous avez déjà réclamé votre salaire quotidien aujourd'hui.\nVeuillez réessayer dans **${hoursRemaining} heures**.`)
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username}, Iron Gueux à votre service !`, iconURL: interaction.user.displayAvatarURL()
                });

            return interaction.reply({ embeds: [errorEmbed] });
        }

        // 4. Succès : le membre a reçu son salaire quotidien
        const successEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('💰 Salaire quotidien reçu !')
            .setDescription(`Ton salaire quotidien a bien été versé sur ton compte.\nTon nouveau solde est de **${result.newBalance} crédits**.`)
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username}, Iron Gueux à votre service !`, 
                iconURL: interaction.user.displayAvatarURL()
            });

        return interaction.reply({ embeds: [successEmbed] });
    } 
}