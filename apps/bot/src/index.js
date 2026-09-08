import "dotenv/config";
import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
    ],
    loadMessageCommandListeners: false
})

async function main() {
    try {
        await client.login(process.env.TOKEN);
        client.logger.info(`${client.user.tag} est connecté et prêt à l'emploi !`);
    } catch (error) {
        client.logger.error("Erreur lors de la connexion du bot :", error);
        process.exit(1);
    }
}

main();