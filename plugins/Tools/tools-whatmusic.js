import acrcloud from "acrcloud";
const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    let acr = new acrcloud({
        host: "identify-eu-west-1.acrcloud.com",
        access_key: process.env.ACRCLOUD_ACCESS_KEY_1,
        access_secret: process.env.ACRCLOUD_ACCESS_SECRET_1,
      }),
      q = m.quoted ? m.quoted : m,
      mime = (q.msg || q).mimetype || q.mediaType || "";
    if (!/video|audio/.test(mime))
      throw `Reply audio/video with command ${usedPrefix + command}`;
    {
      let buffer = await q?.download();
      m.react(wait);
      let { status, metadata } = await acr.identify(buffer);
      if (0 !== status.code) throw status.msg;
      let { title, artists, album, genres, release_date } = metadata.music[0],
        txt = `*• Title:* ${title}${artists ? `\n*• Artists:* ${artists.map((v) => v.name).join(", ")}` : ""}`;
      (txt += `${album ? `\n*• Album:* ${album.name}` : ""}${genres ? `\n*• Genres:* ${genres.map((v) => v.name).join(", ")}` : ""}\n`),
        (txt += `*• Release Date:* ${release_date}`),
        conn.sendMessage(
          m.chat,
          {
            text: txt.trim(),
            buttons: [
              {
                buttonText: {
                  displayText: "Play Music",
                },
                buttonId: `${usedPrefix}play ${title}`,
              },
            ],
          },
          {
            quoted: m,
          },
        );
    }
  } catch (e) {
    let acr = new acrcloud({
        host: "identify-eu-west-1.acrcloud.com",
        access_key: process.env.ACRCLOUD_ACCESS_KEY_2,
        access_secret: process.env.ACRCLOUD_ACCESS_SECRET_2,
      }),
      q = m.quoted ? m.quoted : m,
      mime = (q.msg || q).mimetype || q.mediaType || "";
    if (!/video|audio/.test(mime))
      throw `Reply audio/video with command ${usedPrefix + command}`;
    {
      let buffer = await q?.download();
      m.react(wait);
      let { status, metadata } = await acr.identify(buffer);
      if (0 !== status.code) throw status.msg;
      let { title, artists, album, genres, release_date } = metadata.music[0],
        txt = `*• Title :* ${title}${artists ? `\n*• Artists :* ${artists.map((v) => v.name).join(", ")}` : ""}`;
      (txt += `${album ? `\n*• Album:* ${album.name}` : ""}${genres ? `\n*• Genres :* ${genres.map((v) => v.name).join(", ")}` : ""}\n`),
        (txt += `*• Release Date :* ${release_date}`),
        await conn.reply(m.chat, txt.trim(), m, {
          viewOnce: !0,
        });
    }
  }
};
(handler.help = handler.alias = ["whatmusic"]),
  (handler.tags = ["tools"]),
  (handler.command = /^(whatmusic)$/i);
export default handler;
