const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");
const mime = require("mime-types");

module.exports = {
    name: "hd",
    aliases: ["hd", "hdr"],
    category: "tool",
    permissions: {
        coin: 10
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
            const uploadUrl = await tools.general.upload(buffer, "image");
            const apiUrl = tools.api.createUrl("crafters", "/tools/pxpic", {
                url: uploadUrl,
                type: "upscale"
            });
            const result = (await axios.get(apiUrl)).data.result.resultImageUrl;

            return await ctx.reply({
                image: {
                    url: result
                },
                mimetype: mime.lookup("png")
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};