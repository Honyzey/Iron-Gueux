import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function clearCommands() {
  try {
    console.log('🧹 Suppression de toutes les commandes globale...');
    
    // Récupère l'ID du bot depuis le token
    const application = await rest.get(Routes.user());

    // Écrase toutes les commandes globales avec un tableau vide
    await rest.put(
      Routes.applicationGuildCommands(application.id, '1146881508590760008'),
      { body: [] }
    );

    console.log('✅ Toutes les commandes globales ont été supprimées !');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error);
  }
}

clearCommands();