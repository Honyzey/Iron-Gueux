import { apiRequest } from './client.js';

export async function claimDaily(guildId, userId) {
    return await apiRequest('POST', `/economy/${guildId}/${userId}/daily`)
}

export async function getMemberCredit(guildId, userId) {
    return await apiRequest('GET', `/economy/${guildId}/${userId}`)
}

export async function ensureMemberEconomyExists(guildId, userId) {
    return await apiRequest('PUT', `/economy/${guildId}/${userId}`)
}

export async function claimWork(guildId, userId) {
    return await apiRequest('POST', `/economy/${guildId}/${userId}/work`)
}

export async function transferCredits(guildId, senderId, receiverId, amount) {
    return await apiRequest('POST', `/economy/${guildId}/send`, {
        senderId,
        receiverId,
        amount
    })
}