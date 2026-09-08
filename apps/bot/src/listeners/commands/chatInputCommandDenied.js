import { Listener } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'chatInputCommandDenied'
    });
  }

  async run(error, { interaction }) {
    let message = error.message;

    if (error.identifier === 'preconditionCooldown') {
        const expiresAt = Math.floor((Date.now() + error.context.remaining) / 1000);
        message = `⏳ Vous devez attendre <t:${expiresAt}:R> avant de réutiliser cette commande.`;
    }

    const payload = {
        content: `${message}`,
        flags: MessageFlags.Ephemeral
    };

    // Si la commande est déjà en cours de réponse ou différée
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(payload);
    }

    // Sinon, on envoie le message de refus en éphémère (privé)
    return interaction.reply(payload);
  }
}