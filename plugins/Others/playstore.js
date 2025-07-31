const { generateSerpApiUrl } = await import("../../lib/serpapi.js");
import fetch from "node-fetch";
import axios from "axios";
import * as cheerio from "cheerio";
const handler = async (m, { command, usedPrefix, conn, text, args }) => {
  let [tema, urutan] = text.split(/[^\w\s]/g);
  if (!tema)
    return m.reply("Input query!\n*Example:*\n.playstore [query]|[nomor]");
  m.react(wait);
  try {
    const param = {
      api_key: process.env.SERPAPI_KEY,
      engine: "google_play",
      q: tema,
    };
    let all = await generateSerpApiUrl(param);
    let data = all.organic_results[0]?.items;
    if (!urutan)
      return m.reply(
        "Input query!\n*Example:*\n.playstore [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
          data.map((item, index) => `*${index + 1}.* ${item.title}`).join("\n"),
      );
    if (isNaN(urutan))
      return m.reply(
        "Input query!\n*Example:*\n.playstore [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
          data.map((item, index) => `*${index + 1}.* ${item.title}`).join("\n"),
      );
    if (urutan > data.length)
      return m.reply(
        "Input query!\n*Example:*\n.playstore [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
          data.map((item, index) => `*${index + 1}.* ${item.title}`).join("\n"),
      );
    let out = data[urutan - 1];
    let caption = `🔍 *[ RESULT ]*

📱 *Judul Aplikasi:* ${out.title || "Tidak ada"}
🌐 *Link:* ${out.link || "Tidak ada"}
🆔 *ID Produk:* ${out.product_id || "Tidak ada"}
⭐ *Rating:* ${out.rating || "Tidak ada"}
👤 *Pengembang:* ${out.author || "Tidak ada"}
📂 *Kategori:* ${out.category || "Tidak ada"}
📥 *Unduhan:* ${out.downloads || "Tidak ada"}
📹 *Video:* ${out.video || "Tidak ada"}
📸 *Thumbnail:* ${out.thumbnail || "Tidak ada"}
🖼️ *Gambar Fitur:* ${out.feature_image || "Tidak ada"}
📋 *Deskripsi:* ${out.description || "Tidak ada"}`;
    m.reply(caption);
  } catch (e) {
    try {
      let item = await playstore(tema);
      let teks = item
        .map((res, index) => {
          return `🔍 *[ RESULT ${index + 1} ]*

📱 *Judul Aplikasi:* ${res.title || "Tidak ada"}
🌐 *Link:* ${res.link || "Tidak ada"}
⭐ *Rating:* ${res.rating || "Tidak ada"}
👤 *Pengembang:* ${res.author || "Tidak ada"}
📸 *Thumbnail:* ${res.thumbnail || "Tidak ada"}`;
        })
        .filter((v) => v)
        .join("\n\n________________________\n\n");
      m.reply(teks);
    } catch (e) {
      m.react(eror);
    }
  }
};
handler.help = ["playstore *[query]|[nomor]*"];
handler.tags = ["search"];
handler.command = /^(playstore)$/i;
export default handler;
async function playstore(query) {
  let html = (
    await axios.get(`https://play.google.com/store/search?q=${query}&c=apps`)
  ).data;
  let $ = cheerio.load(html);
  return $("div.VfPpkd-aGsRMb")
    .get()
    .map((x) => {
      return {
        title: $(x).find("span.DdYX5").text(),
        rating: $(x).find("span.w2kbF").text(),
        author: $(x).find("span.wMUdtb").text(),
        thumbnail: $(x).find(".j2FCNc img").attr("src").replace("s64", "s256"),
        link: "https://play.google.com" + $(x).find("a.Si6A0c").attr("href"),
      };
    });
}
