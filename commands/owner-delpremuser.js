const {
    bold,
    monospace
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "delprem",
    aliases: ["delpremuser"],
    category: "owner",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            owner: true
        });
        if (status) return ctx.reply(message);

        const input = ctx._args.join(" ") || null;

        const senderNumber = ctx.sender.jid.split("@")[0];
        const senderJid = ctx._sender.jid;
        const user = ctx._msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid[0] || `${userId}@s.whatsapp.net`;

        if (!input || !user) return ctx.reply({
            text: `${global.msg.argument}\n` +
                `Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} @${senderNumber}`)}`,
            mentions: [senderJid]
        });

        try {
            const [result] = await ctx._client.onWhatsApp(input.replace(/[^\d]/g, ""));
            if (!result.exists) return ctx.reply(`${bold("[ ! ]")} Akun tidak ada di WhatsApp.`);

            if (user === senderJid) return ctx.reply(`${bold("[ ! ]")} Tidak dapat digunakan pada diri Anda sendiri.`);

            await global.db.set(`user.${user.split("@")[0]}.isPremium`, false);

            ctx.sendMessage(user, {
                text: "Anda telah dihapus sebagai pengguna Premium oleh Owner!"
            });
            ctx.reply(`${bold("[ ! ]")} Berhasil dihapus sebagai pengguna Premium!`);
        } catch (error) {
            console.error("Error:", error);
            return ctx.reply(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`);
        }
    }
};