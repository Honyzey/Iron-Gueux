import { EconomyService } from './economy.service.js';

export async function economyController(fastify, options) {

    fastify.get('/:guildId/:memberId', {
        schema: {
            params: {
                type: 'object',
                required: ['memberId', 'guildId'],
                properties: {
                    memberId: { type: 'string', pattern: '^\\d{17,19}$' },
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await EconomyService.getMemberCredit(request.params.memberId, request.params.guildId);
            return reply.send(result);
        } catch (error) {
            if (error.message === 'MEMBER_ECONOMY_NOT_FOUND') {
                return reply.status(404).send({ error: 'Member economy not found' });
            }
            if (error.message === 'GUILD_NOT_FOUND') {
                return reply.status(404).send({ error: 'Guild not found' });
            }
            throw error;
        }
    });

    fastify.put('/:guildId/:memberId', {
        schema: {
            params: {
                type: 'object',
                required: ['memberId', 'guildId'],
                properties: {
                    memberId: { type: 'string', pattern: '^\\d{17,19}$' },
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await EconomyService.ensureMemberEconomyExists(request.params.memberId, request.params.guildId);
            return reply.send(result.credit);
        } catch (error) {
            if (error.message === 'GUILD_NOT_FOUND') {
                return reply.status(404).send({ error: 'Guild not found' });
            }
            throw error;
        }
    })

    fastify.post('/:guildId/:memberId/daily', {
        schema: {
            params: {
                type: 'object',
                required: ['memberId', 'guildId'],
                properties: {
                    memberId: { type: 'string', pattern: '^\\d{17,19}$' },
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await EconomyService.claimDailyReward(request.params.memberId, request.params.guildId);
            return reply.send(result);
        } catch (error) {
            if (error.message === 'GUILD_NOT_FOUND') {
                return reply.status(404).send({ error: 'Guild not found' });
            }
            if (error.message === 'DAILY_REWARD_ALREADY_CLAIMED') {
                return reply.status(429).send({ error: 'Daily reward already claimed', msRemaining: error.msRemaining });
            }
            throw error;
        }
    })

    fastify.post('/:guildId/:memberId/work', {
        schema: {
            params: {
                type: 'object',
                required: ['memberId', 'guildId'],
                properties: {
                    memberId: { type: 'string', pattern: '^\\d{17,19}$' },
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await EconomyService.claimWork(request.params.memberId, request.params.guildId);
            return reply.send(result);
        } catch (error) {
            if (error.message === 'GUILD_NOT_FOUND') {
                return reply.status(404).send({ error: 'Guild not found' });
            }
            throw error;
        }
    });

    fastify.post('/:guildId/send', {
        schema: {
            params: {
                type: 'object',
                required: ['guildId'],
                properties: {
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            },
            body: {
                type: 'object',
                required: ['senderId', 'receiverId', 'amount'],
                properties: {
                    senderId: { type: 'string', pattern: '^\\d{17,19}$' },
                    receiverId: { type: 'string', pattern: '^\\d{17,19}$' },
                    amount: { type: 'number', exclusiveMinimum: 0 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { senderId, receiverId, amount } = request.body;
            const guildId = request.params.guildId;
            
            const result = await EconomyService.transferCredits(senderId, receiverId, guildId, amount);
            return reply.send(result);
        } catch (error) {
            if (error.message === 'SENDER_NOT_FOUND') {
                return reply.status(404).send({ error: 'Sender not found' });
            }
            if (error.message === 'INSUFFICIENT_FUNDS') {
                return reply.status(400).send({ error: 'Insufficient funds' });
            }
            throw error;
        }
    })

}
