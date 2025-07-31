import fetch from "node-fetch";
const handler = async (m, { conn, args, usedPrefix, text, command }) => {
  if (!text) throw "input text";
  try {
    m.react(wait);
    let res = (await searchPexels(text)).photos,
      v = res[Math.floor(Math.random() * res.length)],
      teks = `🔍 *[ RESULT ]*\n\n🆔 *ID:* ${v.id || "Tidak diketahui"}\n📏 *Width:* ${v.width || "Tidak diketahui"} Original\n📐 *Height:* ${v.height || "Tidak diketahui"} Original\n🔗 *Url:* ${v.url || "Tidak diketahui"}\n📸 *Photographer:* ${v.photographer || "Tidak diketahui"}\n🌐 *Photographer Url:* ${v.photographer_url || "Tidak diketahui"}\n🆔 *Photographer ID:* ${v.photographer_id || "Tidak diketahui"}\n🎨 *Avg Color:* ${v.avg_color || "Tidak diketahui"}\n👍 *Liked:* ${v.liked || "Tidak diketahui"}\n🖼️ *Alt:* ${v.alt || "Tidak diketahui"}\n🔗 *Url:* ${Object.values(v.src).join("\n\n")}\n`;
    await conn.sendFile(
      m.chat,
      v.src.original ||
        v.src.large2x ||
        v.src.large ||
        v.src.medium ||
        v.src.small ||
        v.src.portrait ||
        v.src.landscape ||
        v.src.tiny,
      v.alt || "Tidak diketahui",
      teks,
      m,
    );
  } catch (e) {
    m.react(eror);
  }
};
(handler.help = ["pexels"]),
  (handler.tags = ["internet"]),
  (handler.command = /^(pexels)$/i);
export default handler;
const APIKEY = process.env.PEXELS_API_KEY;
async function searchPexels(query) {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${query}`,
    {
      method: "GET",
      headers: {
        Authorization: APIKEY,
        SameSite: "None",
      },
    },
  );
  return await response.json();
}
