const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "price",
    aliases: ["belibot", "rent", "rentbot", "sewa", "sewabot"],
    category: "group",
    handler: {},
    code: async (ctx) => {
        if (await handler(ctx, module.exports.handler)) return;

        try {
            const senderJid = ctx.sender.jid;
            const senderNumber = senderJid.split(/[:@]/)[0];

            const customText = await db.get(`bot.text.price`);
            const text = customText ?
                customText
                .replace(/%tag%/g, `@${senderNumber}`)
                .replace(/%name%/g, config.bot.name)
                .replace(/%version%/g, config.pkg.version)
                .replace(/%watermark%/g, config.msg.watermark)
                .replace(/%footer%/g, config.msg.footer)
                .replace(/%readmore%/g, config.msg.readmore) :
                quote("❎ Bot ini tidak memiliki harga.");

            return await ctx.reply({
                text: text,
                mentions: [senderJid]
            });
        } catch (error) {
            console.error(`[${config.pkg.name}] Error:`, error);
            return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
        }
    }
};