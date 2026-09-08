import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createDeck, calculateScore, formatHand, isSoftHand, drawDoubleCard } from '../../../utils/casino_utils/blackjackEngine.js';
import { EconomyService } from '../../../services/economyService.js';
import { formatCredits } from '../../../utils/formatters.js';

export class BlackjackCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'blackjack',
            description: 'Jouez au Blackjack !',
            preconditions: ['GuildOnly'],
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption((option) =>
                    option
                        .setName('bet')
                        .setDescription('Le montant de votre mise')
                        .setRequired(true)
                        .setMinValue(1)
                )
        );
    }

    async chatInputRun(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        let betAmount = interaction.options.getInteger('bet');

        // 1. Déduction de la mise initiale
        const betResult = await EconomyService.deductBet(userId, guildId, betAmount);
        if (!betResult.success) {
            return interaction.reply({ content: `❌ ${betResult.message}`, flags: MessageFlags.Ephemeral });
        }

        // 2. Initialisation de la partie
        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        let playerScore = calculateScore(playerHand);
        let dealerScore = calculateScore(dealerHand);

        // 3. Blackjack naturel
        if (playerScore === 21) {
            const winAmount = Math.floor(betAmount * 3);
            const winnings = await EconomyService.addWinnings(userId, guildId, winAmount);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🃏 BLACKJACK !')
                .setDescription(`<@${userId}> a obtenu un Blackjack naturel !\n\n**Ses cartes :** ${formatHand(playerHand)} (21)\n**Banque :** ${formatHand(dealerHand)} (${dealerScore})\n\n🎉 Gains : **${formatCredits(winAmount)}** ! (Solde : **${formatCredits(winnings.newBalance)}**)`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // Vérification du solde pour activer ou non le bouton Doubler
        const userBalance = await EconomyService.getBalance(userId, guildId);
        const canDouble = userBalance >= betAmount;

        // 4. Boutons de jeux initiaux
        const getRow = (allowDouble = true) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Tirer').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('stand').setLabel('Rester').setStyle(ButtonStyle.Secondary)
            );

            if (allowDouble) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('double')
                        .setLabel('Doubler ✖️2')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(!canDouble)
                );
            }
            return row;
        };

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle('🃏 Partie de Blackjack en cours')
            .addFields(
                { name: `Vos cartes (${playerScore})`, value: formatHand(playerHand), inline: true },
                { name: `Banque (${calculateScore([dealerHand[0]])})`, value: formatHand(dealerHand, true), inline: true }
            )
            .setFooter({ text: `Mise engagée : ${formatCredits(betAmount)}${!canDouble ? ' (Solde insuffisant pour doubler)' : ''}` });

        await interaction.reply({ embeds: [embed], components: [getRow(true)], flags: MessageFlags.Ephemeral });
        const response = await interaction.fetchReply();

        // 5. Collector de la partie
        const collector = response.createMessageComponentCollector({ 
            filter: (i) => i.user.id === userId, 
            time: 60000 
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'hit') {
                playerHand.push(deck.pop());
                playerScore = calculateScore(playerHand);

                if (playerScore > 21) {
                    collector.stop('bust');
                } else {
                    // Désactive le bouton Doubler dès le 2ème tirage
                    const updateEmbed = EmbedBuilder.from(embed).setFields(
                        { name: `Vos cartes (${playerScore})`, value: formatHand(playerHand), inline: true },
                        { name: `Banque (${calculateScore([dealerHand[0]])})`, value: formatHand(dealerHand, true), inline: true }
                    );
                    await i.update({ embeds: [updateEmbed], components: [getRow(false)] });
                }
            } else if (i.customId === 'double') {
                // Déduction de la mise supplémentaire pour doubler
                const secondBet = await EconomyService.deductBet(userId, guildId, betAmount);
                if (!secondBet.success) {
                    return i.reply({ content: `❌ ${secondBet.message}`, flags: MessageFlags.Ephemeral });
                }

                betAmount *= 2; // Doubler la mise
                playerHand.push(deck.pop()); // Une seule carte tirée
                playerScore = calculateScore(playerHand);

                if (playerScore > 21) {
                    collector.stop('bust');
                } else {
                    collector.stop('stand'); // Fin du tour automatique après le tirage
                }
            } else if (i.customId === 'stand') {
                collector.stop('stand');
            }
        });

        collector.on('end', async (_, reason) => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit').setLabel('Tirer').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('stand').setLabel('Rester').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );

            if (reason === 'bust') {
                const bustEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('💥 Bust ! Vous avez dépassé 21.')
                    .setDescription(`**Vos cartes :** ${formatHand(playerHand)} (**${playerScore}**)\nVous perdez votre mise de **${formatCredits(betAmount)}**.`);

                await interaction.editReply({ embeds: [bustEmbed], components: [disabledRow] });

                const publicBustEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('💥 Défaite au Blackjack')
                    .setDescription(`<@${userId}> a dépassé 21 et perd sa mise de **${formatCredits(betAmount)}** !`)
                    .addFields(
                        { name: `Main de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                        { name: `Banque (${calculateScore([dealerHand[0]])})`, value: formatHand(dealerHand, true), inline: true }
                    )
                    .setTimestamp();

                return interaction.channel?.send({ embeds: [publicBustEmbed] });
            }

            if (reason === 'stand') {
                // Tour de la banque avec Soft 17
                while (dealerScore < 17 || (dealerScore === 17 && isSoftHand(dealerHand))) {
                    dealerHand.push(deck.pop());
                    dealerScore = calculateScore(dealerHand);
                }

                // Égalité
                if (playerScore === dealerScore && dealerScore <= 21) {
                    await EconomyService.refundBet(userId, guildId, betAmount);

                    await interaction.editReply({ content: 'Égalité ! Votre mise a été remboursée.', embeds: [], components: [disabledRow] });

                    const pushEmbed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('🤝 Égalité au Blackjack (Push)')
                        .setDescription(`La mise de **${formatCredits(betAmount)}** de <@${userId}> a été remboursée.`)
                        .addFields(
                            { name: `Cartes de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                            { name: `Banque (${dealerScore})`, value: formatHand(dealerHand), inline: true }
                        )
                        .setTimestamp();

                    return interaction.channel?.send({ embeds: [pushEmbed] });
                }

                // Défaite
                if (dealerScore <= 21 && dealerScore > playerScore) {
                    await interaction.editReply({ content: 'Défaite ! La banque a gagné.', embeds: [], components: [disabledRow] });

                    const lossEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Défaite au Blackjack')
                        .setDescription(`La banque l'emporte avec ${dealerScore}. <@${userId}> perd sa mise de **${formatCredits(betAmount)}**.`)
                        .addFields(
                            { name: `Cartes de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                            { name: `Banque (${dealerScore})`, value: formatHand(dealerHand), inline: true }
                        )
                        .setTimestamp();

                    return interaction.channel?.send({ embeds: [lossEmbed] });
                }

                // Victoire -> Proposition Quitte ou Double
                let currentWinnings = betAmount * 2;

                const gambleRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim').setLabel('Encaisser').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('gamble_red').setLabel('Quitte ou Double (Rouge 🔴)').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('gamble_black').setLabel('Quitte ou Double (Noir ⬛)').setStyle(ButtonStyle.Secondary)
                );

                const gambleEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎉 Victoire au Blackjack !')
                    .setDescription(`Vous avez battu la banque !\n\n💰 Gain potentiel : **${formatCredits(currentWinnings)}**\n\nSouhaitez-vous **encaisser** ou tenter le **Quitte ou Double** ?`)
                    .setFooter({ text: 'Temps limite : 30 secondes' });

                await interaction.editReply({ embeds: [gambleEmbed], components: [gambleRow] });

                const gambleCollector = response.createMessageComponentCollector({
                    filter: (i) => i.user.id === userId,
                    time: 30000
                });

                gambleCollector.on('collect', async (i) => {
                    if (i.customId === 'claim') {
                        const winnings = await EconomyService.addWinnings(userId, guildId, currentWinnings);

                        await i.update({
                            content: `💰 Victoire encaissée ! Vous repartez avec **${formatCredits(currentWinnings)}**.`,
                            embeds: [],
                            components: []
                        });

                        const publicWinEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('🎉 Victoire au Blackjack !')
                            .setDescription(`<@${userId}> gagne **${formatCredits(currentWinnings)}** !\nNouveau solde : **${formatCredits(winnings.newBalance)}**.`)
                            .addFields(
                                { name: `Cartes de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                                { name: `Banque (${dealerScore})`, value: formatHand(dealerHand), inline: true }
                            )
                            .setTimestamp();

                        gambleCollector.stop('claimed');
                        return interaction.channel?.send({ embeds: [publicWinEmbed] });
                    }

                    if (i.customId === 'gamble_red' || i.customId === 'gamble_black') {
                        const chosenColor = i.customId === 'gamble_red' ? 'red' : 'black';
                        const card = drawDoubleCard();

                        if (card.color === chosenColor) {
                            currentWinnings *= 2;
                            const winnings = await EconomyService.addWinnings(userId, guildId, currentWinnings);

                            await i.update({
                                content: `🔥 **QUITTE OU DOUBLE RÉUSSI !** La carte était **${card.value}${card.suit}**.\n🎉 Vous repartez avec **${formatCredits(currentWinnings)}** !`,
                                embeds: [],
                                components: []
                            });

                            const publicGambleWinEmbed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setTitle('🔥 Victoire & Quitte ou Double !')
                                .setDescription(`<@${userId}> a battu la banque ET réussi son Quitte ou Double ! (Carte : ${card.value}${card.suit})\n\n🎉 Gains totaux : **${formatCredits(currentWinnings)}** ! (Solde : **${formatCredits(winnings.newBalance)}**)`)
                                .addFields(
                                    { name: `Cartes de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                                    { name: `Banque (${dealerScore})`, value: formatHand(dealerHand), inline: true }
                                )
                                .setTimestamp();

                            gambleCollector.stop('won_gamble');
                            return interaction.channel?.send({ embeds: [publicGambleWinEmbed] });
                        } else {
                            await i.update({
                                content: `💥 **PERDU !** La carte était **${card.value}${card.suit}**. Vous perdez la totalité de vos gains.`,
                                embeds: [],
                                components: []
                            });

                            const publicGambleLossEmbed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('💥 Quitte ou Double Perdu !')
                                .setDescription(`<@${userId}> avait gagné contre la banque mais a tout perdu au Quitte ou Double ! (Carte tirée : ${card.value}${card.suit})`)
                                .addFields(
                                    { name: `Cartes de <@${userId}> (${playerScore})`, value: formatHand(playerHand), inline: true },
                                    { name: `Banque (${dealerScore})`, value: formatHand(dealerHand), inline: true }
                                )
                                .setTimestamp();

                            gambleCollector.stop('lost_gamble');
                            return interaction.channel?.send({ embeds: [publicGambleLossEmbed] });
                        }
                    }
                });

                gambleCollector.on('end', async (_, gambleReason) => {
                    if (gambleReason === 'time') {
                        const winnings = await EconomyService.addWinnings(userId, guildId, currentWinnings);
                        await interaction.editReply({
                            content: `⏱️ Temps écoulé. Vos gains de **${formatCredits(currentWinnings)}** ont été automatiquement encaissés.`,
                            embeds: [],
                            components: []
                        });
                    }
                });
            }

            if (reason === 'time') {
                const timeEmbed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setTitle('⏱️ Temps écoulé !')
                    .setDescription(`Vous avez mis trop de temps à répondre. Votre mise de **${formatCredits(betAmount)}** est conservée par la banque.`);

                return interaction.editReply({ embeds: [timeEmbed], components: [disabledRow] });
            }
        });
    } 
}