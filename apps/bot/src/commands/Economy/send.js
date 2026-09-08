import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economyService.js';
import { formatCredits } from '../../utils/formatters.js';

export class SendCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'send',
            description: 'Envoie des crédits à un autre utilisateur !',
            preconditions: ['GuildOnly'], // Assurez-vous que la commande est utilisée dans un serveur
            cooldownDelay: 60 * 1000, // 1 minute
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) => 
                    option
                        .setName('user')
                        .setDescription('L\'utilisateur à qui vous voulez envoyer des crédits')
                        .setRequired(true)
                )
                .addIntegerOption((option) => 
                    option
                        .setName('amount')
                        .setDescription('Le nombre de crédits à envoyer')
                        .setRequired(true)
                        .setMinValue(1)
                )
        );
    }

    async chatInputRun(interaction) {
        // 1. Récupération de l'utilisateur et du serveur
        const senderId = interaction.user.id;
        const guildId = interaction.guildId;
        const recipient = interaction.options.getUser('user');

        // vérification anti-bot
        if (recipient.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Échec de l\'envoi de crédits !')
                .setDescription('Vous ne pouvez pas envoyer de crédits à un bot.')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username}, Iron Gueux à votre service !`, iconURL: interaction.user.displayAvatarURL()
                });
            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        // 2. utilisation de la méthode sendCredits pour gérer l'envoi de crédits et récupérer le nouveau solde
        const result = await EconomyService.sendCredits(senderId, recipient.id, guildId, interaction.options.getInteger('amount'));

        // 3. Vérification si l'envoi a réussi
        if (!result.success) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Échec de l\'envoi de crédits !')
                .setDescription(result.message)
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username}, Iron Gueux à votre service !`, iconURL: interaction.user.displayAvatarURL()
                });
            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        // 4. Succès : le membre a envoyé des crédits
        const successEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Crédits envoyés avec succès !')
            .setDescription(`Vous avez envoyé **${formatCredits(interaction.options.getInteger('amount'))}** à <@${recipient.id}>.\nVotre nouveau solde est de **${formatCredits(result.newBalance)}**.`)
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username}, Iron Gueux à votre service !`, 
                iconURL: interaction.user.displayAvatarURL()
            });
        return interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
    } 
}