const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "setpp",
    aliases: ["seticon"],
    category: "group",
    permissions: {
        admin: true,
        botAdmin: true,
        group: true
    },
    code: async (ctx) => {
        const msgType = ctx.getMessageType();
        const [checkMedia, checkQuotedMedia] = await Promise.all([
            tools.cmd.checkMedia(msgType, "image"),
            tools.cmd.checkQuotedMedia(ctx.quoted, "image")
        ]);

        if (!checkMedia && !checkQuotedMedia) return await ctx.reply(quote(tools.cmd.generateInstruction(["send", "reply"], "image")));

        try {
            const buffer = await ctx.msg.media.toBuffer() || await ctx.quoted.media.toBuffer();
            await ctx.core.updateProfilePicture(ctx.id, buffer);

            return await ctx.reply(quote(`✅ Berhasil mengubah gambar profil grup!`));
        } catch (error) {
            tools.cmd.handleError(ctx, error, false)
        }
    }
};