import { apiRequest } from './client.js';

export async function syncGuilds(guildIds) {
    return await apiRequest('PUT', '/guilds/sync', { guildIds });
}

export async function getGuildById(guildId) {
    return await apiRequest('GET', `/guilds/${guildId}`);
}

export async function createGuild(guildId) {
    return await apiRequest('PUT', `/guilds/${guildId}`);
}