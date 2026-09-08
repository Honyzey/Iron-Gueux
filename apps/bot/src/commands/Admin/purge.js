import { Command } from '@sapphire/framework';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';

export class PurgeCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'purge',
            description: 'Supprime un nombre de messages dans le salon',
            // Sécurité vérifie les permissions du membre et du bot
            requiredUserPermissions: ['ManageMessages'],
            requiredClientPermissions: ['ManageMessages'],
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addIntegerOption((option) => 
                    option
                        .setName('amount')
                        .setDescription('Le nombre de messages à supprimer (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
        );
    }

    async chatInputRun(interaction) {
        // 1. Récupération du nombre de messages à supprimer
        const amount = interaction.options.getInteger('amount', true);

        // 2. Suppression des messages
        const deletedMessages = await interaction.channel.bulkDelete(amount, true).catch(() => null);

        if (!deletedMessages) {
            return interaction.reply({
                content: '❌ Impossible de supprimer les messages. Assurez-vous que les messages ont moins de 14 jours.',
                flags: MessageFlags.Ephemeral,
            });
        }

        // 3. Réponse à l'utilisateur
        return interaction.reply({
            content: `✅ ${deletedMessages.size} messages ont été supprimés avec succès !`,
            flags: MessageFlags.Ephemeral,
        });
    }
}