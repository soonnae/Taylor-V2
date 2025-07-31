const { generateSerpApiUrl } = await import("../../lib/serpapi.js");
import axios from "axios";
const handler = async (m, { command, usedPrefix, conn, text, args }) => {
  let [tema, urutan] = text.split(/[^\w\s]/g);
  if (!tema)
    return m.reply(
      "Input query!\n*Example:*\n" + usedPrefix + command + " [query]|[nomor]",
    );
  m.react(wait);
  if (command === "googleimg") {
    try {
      const param = {
        api_key: process.env.GOOGLE_IMAGES_API_KEY,
        engine: "google_images",
        q: tema,
        hl: "id",
        gl: "ID",
      };
      let all = await generateSerpApiUrl(param);
      let data = all.images_results;
      if (!urutan)
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      if (isNaN(urutan))
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      if (urutan > data.length)
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      let out = data[urutan - 1];
      let caption = `🔍 *[ HASIL ]*

- *title:* ${out.title || "Tidak ada"}
- *link:* ${out.link || "Tidak ada"}`;
      await conn.sendMessage(
        m.chat,
        {
          image: {
            url: out.original || out.thumbnail,
          },
          caption: caption,
        },
        {
          quoted: m,
        },
      );
    } catch (e) {
      try {
        let all = await GoogleSearch(tema, "images");
        let data = all.image_results;
        if (!urutan)
          return m.reply(
            "Input query!\n*Example:*\n.image2 [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
              data
                .map((item, index) => `*${index + 1}.* ${item.title}`)
                .join("\n"),
          );
        if (isNaN(urutan))
          return m.reply(
            "Input query!\n*Example:*\n.image2 [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
              data
                .map((item, index) => `*${index + 1}.* ${item.title}`)
                .join("\n"),
          );
        if (urutan > data.length)
          return m.reply(
            "Input query!\n*Example:*\n.image2 [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
              data
                .map((item, index) => `*${index + 1}.* ${item.title}`)
                .join("\n"),
          );
        let out = data[urutan - 1];
        let caption = `🔍 *[ HASIL ]*

📋 *Deskripsi:* ${out.title || "Tidak ada"}
📍 *Link:* ${out.link || "Tidak ada"}
📝 *Source:* ${out.source || "Tidak ada"}`;
        await conn.sendMessage(
          m.chat,
          {
            image: {
              url: out.image || logo,
            },
            caption: caption,
          },
          {
            quoted: m,
          },
        );
      } catch (e) {
        m.react(eror);
      }
    }
  }
  if (command === "googlevid") {
    try {
      const param = {
        api_key: process.env.GOOGLE_VIDEOS_API_KEY,
        engine: "google_videos",
        q: tema,
        hl: "id",
        gl: "ID",
      };
      let all = await generateSerpApiUrl(param);
      let data = all.video_results;
      if (!urutan)
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      if (isNaN(urutan))
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      if (urutan > data.length)
        return m.reply(
          "Input query!\n*Example:*\n" +
            usedPrefix +
            command +
            " [query]|[nomor]\n\n*Pilih angka yg ada*\n" +
            data
              .map((item, index) => `*${index + 1}.* ${item.title}`)
              .join("\n"),
        );
      let out = data[urutan - 1];
      let caption = `🔍 *[ HASIL ]*

- *title:* ${out.title || "Tidak ada"}
- *link:* ${out.link || "Tidak ada"}
- *date:* ${out.date || "Tidak ada"}
- *snippet:* ${out.snippet || "Tidak ada"}
- *duration:* ${out.duration || "Tidak ada"}`;
      await conn.sendMessage(
        m.chat,
        {
          video: {
            url: out.video_link || out.thumbnail,
          },
          caption: caption,
        },
        {
          quoted: m,
        },
      );
    } catch (e) {
      m.react(eror);
    }
  }
};
handler.help = ["google *[img/vid query]*"];
handler.tags = ["search"];
handler.command = /^google(img|vid)?$/i;
export default handler;
async function GoogleSearch(q, search_type) {
  try {
    const params = {
      api_key: process.env.VALUE_SERP_API_KEY,
      q: q,
      search_type: search_type,
      gl: "id",
    };
    const response = await axios.get("https://api.valueserp.com/search", {
      params: params,
    });
    return response.data;
  } catch (e) {
    return null;
  }
}
