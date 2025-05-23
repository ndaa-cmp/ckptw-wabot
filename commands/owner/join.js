const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "join",
    aliases: ["j"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${quote(tools.cmd.generateInstruction(["send"], ["text"]))}\n` +
            quote(tools.cmd.generateCommandExample(ctx.used, "https://example.com/"))
        );

        const isUrl = await tools.general.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const urlCode = new URL(url).pathname.split("/").pop();
            const [result] = await ctx.groups.acceptInvite(urlCode);
            if (result.data === 400) return await ctx.reply(quote(`❎ Grup tidak ditemukan.`));
            if (result.data === 401) return await ctx.reply(quote(`❎ Bot telah dikeluarkan dari grup itu.`));
            if (result.data === 409) return await ctx.reply(quote(`❎ Bot telah bergabung dengan grup.`));
            if (result.data === 410) return await ctx.reply(quote(`❎ URL grup telah disetel ulang.`));
            if (result.data === 500) return await ctx.reply(quote(`❎ Grup penuh!`));

            await ctx.sendMessage(result, {
                text: quote(`👋 Halo! Saya adalah Bot WhatsApp bernama ${config.bot.name}, dimiliki oleh ${config.owner.name}. Saya bisa melakukan banyak perintah, seperti membuat stiker, menggunakan AI untuk pekerjaan tertentu, dan beberapa perintah berguna lainnya. Saya di sini untuk menghibur dan menyenangkan Anda!`)
            });

            return await ctx.reply(quote(`✅ Berhasil bergabung dengan grup!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};