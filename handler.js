exports.handler = async (ctx, options) => {
    try {
        const botNumber = ctx._client.user.id.split(':')[0];
        const botJid = `${botNumber}@s.whatsapp.net`
        const senderNumber = ctx._sender.jid.split('@')[0];
        const senderJid = ctx._sender.jid;
        const groupNumber = ctx.isGroup ? ctx._msg.key.remoteJid.split('@')[0] : null;
        const groupJid = ctx.isGroup ? ctx._msg.key.remoteJid : null;
        const groupMetadata = ctx.isGroup ? await ctx._client.groupMetadata(groupJid) : null;
        const groupParticipant = groupMetadata ? groupMetadata.participants : null;
        const groupAdmin = groupParticipant ? groupParticipant.filter(p => p.isAdmin).map(p => p.jid) : [];
        const groupOwner = groupMetadata ? groupMetadata.owner : null;
        const isAdmin = ctx.isGroup ? groupAdmin.includes(senderJid) : false;
        const isBotAdmin = ctx.isGroup ? groupAdmin.includes(botJid) : false;
        const isOwner = global.owner.number === senderNumber || global.owner.co.includes(senderNumber);
        const isGroup = ctx.isGroup;
        const isPrivate = !isGroup;
        const msg = global.msg;

        const checkOptions = {
            admin: {
                function: () => !isAdmin,
                msg: msg.admin
            },
            banned: {
                function: async () => await global.db.get(`user.${senderNumber}.isBanned`),
                msg: msg.banned
            },
            botAdmin: {
                function: () => !isBotAdmin,
                msg: msg.botAdmin
            },
            group: {
                function: () => isGroup,
                msg: msg.group
            },
            owner: {
                function: () => !isOwner,
                msg: msg.owner
            },
            private: {
                function: () => isPrivate,
                msg: msg.private
            }
        };

        for (const option of Object.keys(options)) {
            const checkOption = checkOptions[option];
            if (checkOption && await checkOption.function()) {
                return {
                    status: true,
                    message: checkOption.msg
                };
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            status: false,
            message: 'An error occurred while processing the request.'
        };
    }

    return {
        status: false,
        message: null
    };
};