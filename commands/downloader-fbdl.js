const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");
const {
    ndown
} = require("nayan-media-downloader");

module.exports = {
    name: "fbdl",
    aliases: ["fb", "facebook"],
    category: "downloader",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            coin: 3
        });
        if (status) return ctx.reply(message);

        const url = ctx._args[0] || null;

        if (!url) return ctx.reply(
            `${quote(global.msg.argument)}\n` +
            quote(`Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} https://example.com/`)}`)
        );

        const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
        if (!urlRegex.test(url)) return ctx.reply(global.msg.urlInvalid);

        try {
            const result = await ndown(url);

            if (!result.status) return ctx.reply(global.msg.notFound);

            return await ctx.reply({
                video: {
                    url: result.data[0].url,
                },
                mimetype: mime.contentType("mp4"),
                caption: `${quote(`URL: ${url}`)}\n` +
                    "\n" +
                    global.msg.footer,
                gifPlayback: false
            });
        } catch (error) {
            console.error("Error:", error);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};