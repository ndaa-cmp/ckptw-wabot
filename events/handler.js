const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const {
    Events
} = require("@mengkodingan/ckptw/lib/Constant");
const axios = require("axios");
const {
    exec
} = require("child_process");
const fs = require("fs");
const util = require("util");

// Utilitas
async function handleUserEvent(bot, m, type) {
    const {
        id,
        participants
    } = m;

    try {
        const groupId = tools.general.getID(id);
        const groupDb = await db.get(`group.${groupId}`) || {};

        if (groupDb?.option?.welcome) {
            const metadata = await bot.core.groupMetadata(id);

            for (const jid of participants) {
                const profilePictureUrl = await bot.core.profilePictureUrl(jid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                const customText = type === "UserJoin" ? groupDb?.text?.welcome : groupDb?.text?.goodbye;
                const userTag = `@${tools.general.getID(jid)}`;

                const text = customText ?
                    customText
                    .replace(/%tag%/g, userTag)
                    .replace(/%subject%/g, metadata.subject)
                    .replace(/%description%/g, metadata.description) :
                    (type === "UserJoin" ?
                        quote(`👋 Selamat datang ${userTag} di grup ${metadata.subject}!`) :
                        quote(`👋 ${userTag} keluar dari grup ${metadata.subject}.`));

                await bot.core.sendMessage(id, {
                    text,
                    contextInfo: {
                        mentionedJid: [jid],
                        externalAdReply: {
                            mediaType: 1,
                            previewType: 0,
                            mediaUrl: config.bot.website,
                            title: config.msg.watermark,
                            body: null,
                            renderLargerThumbnail: true,
                            thumbnailUrl: profilePictureUrl || config.bot.thumbnail,
                            sourceUrl: config.bot.website
                        }
                    }
                });

                if (type === "UserJoin" && groupDb?.text?.intro) await bot.core.sendMessage(id, {
                    text: groupDb?.text?.intro,
                    mentions: [jid]
                });
            }
        }
    } catch (error) {
        consolefy.error(`Error: ${error}`);
        await bot.core.sendMessage(id, {
            text: quote(`⚠️ Terjadi kesalahan: ${error.message}`)
        });
    }
}

module.exports = (bot) => {
    // Penanganan acara saat bot siap
    bot.ev.once(Events.ClientReady, async (m) => {
        consolefy.success(`${config.bot.name} by ${config.owner.name}, ready at ${m.user.id}`);

        const botRestart = await db.get("bot.restart") || {};
        if (botRestart && botRestart.jid && botRestart.timestamp) {
            const timeago = tools.general.convertMsToDuration(Date.now() - botRestart.timestamp);
            await bot.core.sendMessage(botRestart.jid, {
                text: quote(`✅ Berhasil dimulai ulang! Membutuhkan waktu ${timeago}.`),
                edit: botRestart.key
            });
            db.delete("bot.restart");
        }

        // Tetapkan config pada bot
        const id = tools.general.getID(m.user.id);
        await Promise.all([
            config.bot.id = id,
            config.bot.jid = `${id}@s.whatsapp.net`,
            config.bot.readyAt = bot.readyAt
        ]);

        if (config.system.requireBotGroupMembership) {
            const code = await bot.core.groupInviteCode(config.bot.groupJid) || "FxEYZl2UyzAEI2yhaH34Ye";
            config.bot.groupLink = `https://chat.whatsapp.com/${code}`;
        }
    });

    // Penanganan event ketika pesan muncul
    bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
        const isGroup = ctx.isGroup();
        const isPrivate = !isGroup;

        const senderJid = ctx.sender.jid;
        const senderId = tools.general.getID(senderJid);
        const groupJid = isGroup ? ctx.id : null;
        const groupId = isGroup ? tools.general.getID(groupJid) : null;

        const isCmd = tools.general.isCmd(m.content, ctx._config);
        const isOwner = tools.general.isOwner(senderId);

        // Mengambil basis data
        const userDb = await db.get(`user.${senderId}`) || {};
        const groupDb = await db.get(`group.${groupId}`) || {};
        const botDb = await db.get("bot") || {};

        // Penanganan pada mode bot
        if (isPrivate && botDb.mode === "group") return;
        if (isGroup && botDb.mode === "private") return;
        if (!isOwner && botDb.mode === "self") return;

        // Penanganan mute
        if (groupDb.mute) return;

        // Log pesan masuk
        if (isGroup) {
            consolefy.info(`Incoming message from group: ${groupId}, by: ${senderId}`);
        } else {
            consolefy.info(`Incoming message from: ${senderId}`);
        }

        // Grup atau Pribadi
        if (isGroup || isPrivate) {
            // Penangan pada ukuran basis data
            config.bot.dbSize = fs.existsSync("database.json") ? tools.general.formatSize(fs.statSync("database.json").size / 1024) : "N/A";

            // Penanganan untuk perintah
            if (isCmd) {
                // Penanganan 'Did you mean?' untuk perintah yang salah ketik
                if (isCmd.didyoumean) await ctx.reply(quote(`❎ Anda salah ketik, sepertinya ${monospace(isCmd.prefix + isCmd.didyoumean)}.`));

                // Penanganan XP & Level untuk pengguna
                const xpGain = 10;
                let xpToLevelUp = 100;

                let newUserXp = userDb?.xp + xpGain;

                if (newUserXp >= xpToLevelUp) {
                    let newUserLevel = userDb?.level + 1;
                    newUserXp -= xpToLevelUp;

                    xpToLevelUp = Math.floor(xpToLevelUp * 1.2);

                    const profilePictureUrl = await ctx.core.profilePictureUrl(senderJid, "image").catch(() => "https://i.pinimg.com/736x/70/dd/61/70dd612c65034b88ebf474a52ccc70c4.jpg");

                    if (userDb?.autolevelup) await ctx.reply({
                        text: `${quote(`Selamat! Kamu telah naik ke level ${newUserLevel}!`)}\n` +
                            `${config.msg.readmore}\n` +
                            quote(tools.msg.generateNotes([`Terganggu? Ketik ${monospace(`${isCmd.prefix}setprofile autolevelup`)} untuk menonaktifkan pesan autolevelup.`])),
                        contextInfo: {
                            externalAdReply: {
                                mediaType: 1,
                                previewType: 0,
                                mediaUrl: config.bot.website,
                                title: config.msg.watermark,
                                body: null,
                                renderLargerThumbnail: true,
                                thumbnailUrl: profilePictureUrl || config.bot.thumbnail,
                                sourceUrl: config.bot.website
                            }
                        }
                    });

                    await Promise.all([
                        db.set(`user.${senderId}.xp`, newUserXp),
                        db.set(`user.${senderId}.level`, newUserLevel)
                    ]);
                } else {
                    await db.set(`user.${senderId}.xp`, newUserXp);
                }
            }

            // Perintah khusus Owner
            if (isOwner) {
                // Perintah Eval: Jalankan kode JavaScript
                if (m.content && m.content.startsWith && (m.content.startsWith("==> ") || m.content.startsWith("=> "))) {
                    const code = m.content.slice(m.content.startsWith("==> ") ? 4 : 3);

                    try {
                        const result = await eval(m.content.startsWith("==> ") ? `(async () => { ${code} })()` : code);

                        await ctx.reply(monospace(util.inspect(result)));
                    } catch (error) {
                        consolefy.error(`Error: ${error}`);
                        await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
                    }
                }

                // Perintah Exec: Jalankan perintah shell
                if (m.content && m.content.startsWith && m.content.startsWith("$ ")) {
                    const command = m.content.slice(2);

                    try {
                        const output = await util.promisify(exec)(command);

                        await ctx.reply(monospace(output.stdout || output.stderr));
                    } catch (error) {
                        consolefy.error(`Error: ${error}`);
                        await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
                    }
                }
            }

            // Penanganan AFK: Pengguna yang disebutkan
            const mentionJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionJids && mentionJids.length > 0) {
                for (const mentionJid of mentionJids) {
                    const userAFK = await db.get(`user.${mentionJid}.afk`) || {};

                    if (userAFK && userAFK.reason && userAFK.timestamp) {
                        const timeago = tools.general.convertMsToDuration(Date.now() - userAFK.timestamp);
                        await ctx.reply(quote(`📴 Dia sedang AFK ${userAFK.reason ? `dengan alasan "${userAFK.reason}"` : "tanpa alasan"} selama ${timeago}.`));
                    }
                }
            }

            const userAFK = await db.get(`user.${senderId}.afk`) || {};

            if (userAFK && userAFK.reason && userAFK.timestamp) {
                const currentTime = Date.now();
                const timeElapsed = currentTime - userAFK.timestamp;

                if (timeElapsed > 3000) {
                    const timeago = tools.general.convertMsToDuration(timeElapsed);
                    await ctx.reply(quote(`📴 Anda telah keluar dari AFK ${userAFK.reason ? `dengan alasan "${userAFK.reason}"` : "tanpa alasan"} selama ${timeago}.`));
                    await db.delete(`user.${senderId}.afk`);
                }
            }
        }

        // Grup
        if (isGroup) {
            if (m.key.fromMe) return;

            // Penanganan antilink
            if (groupDb?.option?.antilink) {
                const isUrl = await tools.general.isUrl(m.content);
                if (m.content && await tools.general.isUrl(m.content) && !await ctx.group().isSenderAdmin()) {
                    await ctx.reply(quote(`⛔ Jangan kirim tautan!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) await ctx.group().kick([senderJid]);
                }
            }

            // Penanganan antinsfw
            if (groupDb?.option?.antinsfw) {
                const msgType = ctx.getMessageType();
                const checkMedia = await tools.general.checkMedia(msgType, "image");
                if (checkMedia && !await ctx.group().isSenderAdmin()) {
                    const buffer = await ctx.msg.media.toBuffer();
                    const uploadUrl = await tools.general.upload(buffer);

                    const apiUrl = tools.api.createUrl("fasturl", "/tool/imagechecker", {
                        url: uploadUrl
                    });
                    const {
                        data
                    } = await axios.get(apiUrl);

                    if (data.results.status === "NSFW") {
                        await ctx.reply(`⛔ Jangan kirim NSFW!`);
                        await ctx.deleteMessage(m.key);
                        if (!config.system.restrict && groupDb?.option?.autokick) await ctx.group().kick([senderJid]);
                    }
                }
            }

            // Penanganan antisticker
            if (groupDb?.option?.antisticker) {
                const msgType = ctx.getMessageType();
                const checkMedia = await tools.general.checkMedia(msgType, "sticker");

                if (checkMedia && !await ctx.group().isSenderAdmin()) {
                    await ctx.reply(`⛔ Jangan kirim stiker!`);
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) await ctx.group().kick([senderJid]);
                }
            }

            // Penanganan antitoxic
            if (groupDb?.option?.antitoxic) {
                const toxicRegex = /anj(k|g)|ajn?(g|k)|a?njin(g|k)|bajingan|b(a?n)?gsa?t|ko?nto?l|me?me?(k|q)|pe?pe?(k|q)|meki|titi(t|d)|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|(k|ng)e?nto?(t|d)|jembut|bego|dajj?al|janc(u|o)k|pantek|puki ?(mak)?|kimak|kampang|lonte|col(i|mek?)|pelacur|henceu?t|nigga|fuck|dick|bitch|tits|bastard|asshole|dontol|kontoi|ontol/i;
                if (m.content && toxicRegex.test(m.content) && !await ctx.group().isSenderAdmin()) {
                    await ctx.reply(quote(`⛔ Jangan toxic!`));
                    await ctx.deleteMessage(m.key);
                    if (!config.system.restrict && groupDb?.option?.autokick) await ctx.group().kick([senderJid]);
                }
            }
        }

        // Pribadi
        if (isPrivate) {
            if (m.key.fromMe) return;

            // Penanganan menfess
            const allMenfessDb = await db.get("menfess") || {};
            if ((!isCmd || isCmd.didyoumean) && allMenfessDb && typeof allMenfessDb === "object" && Object.keys(allMenfessDb).length > 0) {
                const menfessEntries = Object.entries(allMenfessDb);

                for (const [conversationId, menfessData] of menfessEntries) {
                    const {
                        from,
                        to
                    } = menfessData;
                    const senderInConversation = senderId === from || senderId === to;

                    if (m.content && /^\b(delete|stop)\b$/i.test(m.content.trim()) && senderInConversation) {
                        const targetId = senderId === from ? to : from;
                        const message = "✅ Pesan menfess telah dihapus!";

                        await ctx.reply(quote(message));
                        await ctx.sendMessage(`${targetId}@s.whatsapp.net`, {
                            text: quote(message)
                        });
                        await db.delete(`menfess.${conversationId}`);
                        break;
                    }

                    if (senderInConversation) {
                        const targetId = senderId === from ? `${to}@s.whatsapp.net` : `${from}@s.whatsapp.net`;

                        await ctx.core.sendMessage(targetId, {
                            forward: m
                        });

                        break;
                    }
                }
            }
        }
    });

    // Penanganan peristiwa ketika pengguna bergabung atau keluar dari grup
    bot.ev.on(Events.UserJoin, async (m) => handleUserEvent(bot, m, "UserJoin"));
    bot.ev.on(Events.UserLeave, async (m) => handleUserEvent(bot, m, "UserLeave"));
};