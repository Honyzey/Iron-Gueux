import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economyService.js';

export class WorkCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'work',
            description: 'Fais du travail pour gagner des crédits !',
            cooldownDelay: 2 * 60 * 60 * 1000, // 2 heures
            cooldownFilteredUsers: ['338763821923696641'],
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

        // 2. Appel de la méthode claimWork pour gérer le travail et récupérer le nouveau solde
        const result = await EconomyService.claimWork(userId, guildId);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('💼 Travail effectué !')
            .setDescription(`Vous avez gagné **${result.randomAmount} crédits** pour votre travail.`)
            .setFields(
                { name: '💰 Nouveau solde', value: `${result.updatedMember} crédits`, inline: true },
                { name: '⏳ Prochain travail disponible dans', value: '2 heures', inline: true }
            )
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username}, Iron Gueux à votre service !`, iconURL: interaction.user.displayAvatarURL()
            });

        return interaction.reply({ embeds: [embed] });
    } 
}