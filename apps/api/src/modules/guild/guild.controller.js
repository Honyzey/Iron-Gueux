import { GuildService } from './guild.service.js';

export async function guildController(fastify, options) {

    fastify.put('/sync', {
        schema: {
            body: {
                type: 'object',
                required: ['guildIds'],
                properties: {
                    guildIds: {
                        type: 'array',
                        items: { type: 'string', pattern: '^\\d{17,19}$' }
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        guildsCreated: { type: 'number' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { guildIds } = request.body;
        const result = await GuildService.syncGuilds(guildIds);
        return reply.send(result);
    });

    fastify.get('/:guildId', {
        schema: {
            params: {
                type: 'object',
                required: ['guildId'],
                properties: {
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const result = await GuildService.getGuildById(request.params.guildId);
            return reply.send(result);
        } catch (error) {
            if (error.message === 'GUILD_NOT_FOUND') {
                return reply.status(404).send({ error: 'Guild not found'});
            }
            throw error;
        }
    });

    fastify.put('/:guildId', {
        schema: {
            params: {
                type: 'object',
                required: ['guildId'],
                properties: {
                    guildId: { type: 'string', pattern: '^\\d{17,19}$' }
                }
            }
        }
    }, async (request, reply) => {
        const { guildId } = request.params;
        const result = await GuildService.createGuildById(guildId);
        return reply.send(result);
    })
}