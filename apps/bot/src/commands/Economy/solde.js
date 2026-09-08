import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../../services/economyService.js';
import { formatCredits } from '../../utils/formatters.js';

export class SoldeCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'solde', // ou 'balance' / 'wallet'
            description: 'Affiche votre solde de crédits ou celui d\'un autre joueur.',
            preconditions: ['GuildOnly'],
            cooldownDelay: 10 * 1000,
            cooldownFilteredUsers: ['338763821923696641'], // ID de l'utilisateur exempté du cooldown
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) => 
                    option
                        .setName('joueur')
                        .setDescription('Le joueur dont vous voulez vérifier le solde (optionnel)')
                        .setRequired(false)
                )
        );
    }

    async chatInputRun(interaction) {
        const targetUser = interaction.options.getUser('joueur') || interaction.user;
        const guildId = interaction.guildId;

        // Vérification si l'utilisateur cible est un bot
        if (targetUser.bot) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Échec de la vérification du solde !')
                .setDescription('Vous ne pouvez pas vérifier le solde d\'un bot.')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username}, Iron Gueux à votre service !`, iconURL: interaction.user.displayAvatarURL()
                });
            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        // Restriction de permission si un autre utilisateur est ciblé
        if (targetUser.id !== interaction.user.id && !interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({
                content: '❌ Seuls les administrateurs peuvent consulter le solde d\'un autre joueur.',
                flags: MessageFlags.Ephemeral
            });
        }

        const balance = await EconomyService.getBalance(targetUser.id, guildId);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('💰 Portefeuille de crédits')
            .setDescription(
                targetUser.id === interaction.user.id
                    ? `Vous possédez actuellement **${formatCredits(balance)}**.`
                    : `Le solde de ${targetUser} est de **${formatCredits(balance)}**.`
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username}, Iron Gueux à votre service !`,
                iconURL: interaction.user.displayAvatarURL()
            });

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } 
}