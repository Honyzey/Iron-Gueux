import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';

export class PingCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'ping',
            description: 'Répond avec Pong !',
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
        // 1. Réponse initiale pour calculer le ping
        const response = await interaction.reply({ content: 'Calcul du ping...', withResponse: true, flags: MessageFlags.Ephemeral });

        // 2. Récupération des données du client et de l'utilisateur
        const client = this.container.client;
        const user = interaction.user;
        
        const createdTimestamp = response.resource?.message?.createdTimestamp ?? Date.now();
        const diff = createdTimestamp - interaction.createdTimestamp;
        const ping = Math.round(this.container.client.ws.ping);

        // 3. Création de l'embed avec les informations de ping
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(` \`🏓\`__Ping de ${client.user.username}__`)
            .setURL('https://www.youtube.com/watch?v=O91DT1pR1ew')
            .addFields(
                {name: `**Latence du bot** |`, value: `${diff} ms`, inline: true},
                {name: `**Latence de l'api de djs** |`, value: `${ping} ms`, inline: true},
                {name: `**Uptime**`, value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true}
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({
                text: `${user.username}, Iron Gueux à votre service !`, iconURL: user.displayAvatarURL()
            });

        // 4. Édition de la réponse initiale avec l'embed et les informations de ping
        return interaction.editReply({
            content: null,
            embeds: [embed]
        });
    } 
}