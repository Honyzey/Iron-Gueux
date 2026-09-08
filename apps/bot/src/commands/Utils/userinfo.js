import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';

export class UserInfoCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'userinfo',
            description: 'Affiche les informations de l\'utilisateur',
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
                        .setDescription('L\'utilisateur dont vous voulez voir les informations')
                        .setRequired(false)
                )
        );
    }

    async chatInputRun(interaction) {
        // 1. Récupération de l'utilisateur
        const user = interaction.options.getUser('user') ?? interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        // 2. Récupération des données de l'utilisateur
        // récupération de l'accent color
        const accentColor = member?.displayColor || 0xff0000;

        // 3. Création de l'embed avec les informations de l'utilisateur
        const embed = new EmbedBuilder()
            .setColor(accentColor)
            .setImage(user.displayAvatarURL({ size: 1024, extension: 'png' }))
            .addFields(
                { name: 'Nom', value: `${member.displayName}`, inline: true},
                { name: 'ID', value: `${user.id}`, inline: true},
                { name: 'Bot', value: `${user.bot ? 'Oui' : 'Non'}`, inline: true},
                { name: 'Créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true},
                { name: 'Rejoint le', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'N/A', inline: true},
                { name: 'Rôles', value: member ? member.roles.cache.map(role => role.toString()).join(', ') : 'N/A', inline: false}
            )
            .setTimestamp()
            .setFooter({
                text: `${user.username}, Iron Gueux à votre service !`, iconURL: user.displayAvatarURL()
            });

        // 4. Édition de la réponse initiale avec l'embed et les informations de ping
        return interaction.reply({
            content: null,
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    } 
}