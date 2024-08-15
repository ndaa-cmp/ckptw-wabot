const {
    bold,
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const {
    youtubedl,
    youtubedlv2
} = require("@bochilteam/scraper");
const mime = require("mime-types");

module.exports = {
    name: "ytv",
    aliases: ["ytmp4", "ytvideo"],
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

        const input = ctx._args.join(" ") || null;

        if (!input) return ctx.reply(
            `${quote(global.msg.argument)}\n` +
            `Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} https://example.com/`)}`
        );

        const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
        if (!urlRegex.test(input)) ctx.reply(global.msg.urlInvalid);

        try {
            let ytdl;
            try {
                ytdl = await youtubedl(input);
            } catch (error) {
                ytdl = await youtubedlv2(input);
            }
            const qualityOptions = Object.keys(ytdl.video);

            await ctx.reply(
                `${quote(`Judul: ${ytdl.title}`)}\n` +
                `${quote(`URL: ${input}`)}\n` +
                `${quote(`Pilih kualitas:`)}\n` +
                `${qualityOptions.map((quality, index) => `${index + 1}. ${quality}`).join("\n")}\n` +
                "\n" +
                global.msg.footer
            );

            const col = ctx.MessageCollector({
                time: 60000, // 1 minute.
            });

            col.on("collect", async (m) => {
                const selectedNumber = parseInt(m.content.trim());
                const selectedQualityIndex = selectedNumber - 1;

                if (!isNaN(selectedNumber) && selectedQualityIndex >= 0 && selectedQualityIndex < qualityOptions.length) {
                    const selectedQuality = qualityOptions[selectedQualityIndex];
                    const downloadFunction = ytdl.video[selectedQuality].download;
                    ctx.react(ctx.id, "🔄", m.key);
                    const url = await downloadFunction();
                    await ctx.reply({
                        video: {
                            url: url,
                        },
                        mimetype: mime.contentType("mp4"),
                        caption: `${quote(`Kualitas: ${selectedQuality}`)}\n` +
                            "\n" +
                            global.msg.footer,
                        gifPlayback: false
                    });
                    return col.stop();
                }
            });

            col.on("end", async (collector, r) => {
                // No response when collector ends.
            });
        } catch (error) {
            console.error("Error:", error);
            return ctx.reply(quote(`${bold("[ ! ]")} Terjadi kesalahan: ${error.message}`));
        }
    }
};