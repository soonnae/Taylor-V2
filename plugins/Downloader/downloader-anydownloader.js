import fetch from "node-fetch";
const handler = async (m, { conn, args, usedPrefix, command }) => {
  const msg = `❌ Input link atau reply link yang ingin di download!\n\n*Contoh:*\n${usedPrefix + command} link`;
  const text =
    args.length >= 1 ? args.join(" ") : (m.quoted && m.quoted.text) || null;
  if (!text) return m.reply(msg);
  const query = text.trim();
  m.react(wait);
  try {
    const result = await anydownloader(query);
    const formattedResult = formatResult(result);
    const noWatermarkMedia = result.medias?.find(
      (media) => media.quality === "No Watermark",
    );
    noWatermarkMedia
      ? await conn.sendFile(
          m.chat,
          noWatermarkMedia.url,
          "",
          formattedResult,
          m,
        )
      : await conn.reply(m.chat, formattedResult, m);
  } catch (error) {
    m.react(eror);
  }
};
handler.help = ["anydownloader *[link/query]*"];
handler.tags = ["downloader"];
handler.command = /^(anydownloader)$/i;
export default handler;
const formatResult = (data) => {
  const { url, title, thumbnail, medias } = data;
  const message =
    `📥 *Download Result* 📥\n\n` +
    `📄 *Title:* ${title}\n` +
    `🔗 *URL:* ${url}\n` +
    `🖼️ *Thumbnail:* ${thumbnail}\n\n` +
    `🎥 *Media Files* 🎵\n\n` +
    medias
      .map(
        (media, index) =>
          `🔹 *Media ${index + 1}*\n` +
          `🔸 *Type:* ${media.extension.toUpperCase()}\n` +
          `🔸 *Size:* ${media.formattedSize}\n` +
          `🔸 *Quality:* ${media.quality}\n` +
          `🔸 *Link:* ${media.url}\n\n`,
      )
      .join("");
  return message;
};
async function anydownloader(inputUrl) {
  try {
    const response = await fetch(
      "https://anydownloader.com/wp-json/aio-dl/video-data/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          url: inputUrl,
          token: process.env.ANYDOWNLOADER_TOKEN, // Use environment variable for token
        }),
      },
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Terjadi kesalahan saat mengambil data.");
  }
}
