import fetch from "node-fetch";
async function MyAnima(query, local_uuid) {
  const url = "https://api.myanima.ai/api/messaging/handle";
  const headers = {
    "APP-PLATFORM": "web",
    "APP-ID-TOKEN": "anima",
    "Content-Type": "application/json",
    "Chat-Features":
      "short_chat_onboarding,backendControlledPromoOffers,customRelationshipStatuses,lockedMessages_v2,smartAppRatingV2,lightTheme,gifts,awards,v2MessageMetadata,xpCoins,lightPaywall,customPromoOffer,sendingVoice,chat_trigger:change_relationship_status_popup,chat_trigger:giftsPromotion,chat_trigger:regular_photos_limit_popup,chat_trigger:spicy_photos_limit_popup",
    "Client-Service": "web",
    "CURRENT-TIME": "1726734456",
    "APP-VERSION": "2.52.1",
    Authorization: `Bearer ${process.env.MYANIMA_AUTH_TOKEN}`,
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    Referer: "https://myanima.ai/app",
  };
  const body = {
    query: query || "can you speak go",
    local_uuid: local_uuid || "56e38230-a209-49bc-99e2-5952708d5411",
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data.messages[0]?.text || "No msg";
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!db.data.dbai.myanima) db.data.dbai.myanima = {};
  const inputText = args.length
    ? args.join(" ")
    : m.quoted?.text || m.quoted?.caption || m.quoted?.description || null;
  if (!inputText) {
    return m.reply(
      `Masukkan teks atau reply pesan dengan teks yang ingin diolah.\nContoh penggunaan:\n*${usedPrefix}${command} Hai, apa kabar?*`,
    );
  }
  m.react(wait);
  try {
    const answer = await MyAnima(inputText);
    const {
      key: { id: keyId },
    } = await conn.reply(m.chat, `${answer}`, m);
    db.data.dbai.myanima[m.sender] = {
      key: {
        id: keyId,
      },
    };
    m.react(sukses);
  } catch (error) {
    console.error("Handler error:", error);
    m.react(eror);
  }
};
handler.before = async (m, { conn }) => {
  if (
    !db.data.dbai.myanima ||
    m.isBaileys ||
    !(m.sender in db.data.dbai.myanima)
  )
    return;
  const {
    key: { id: keyId },
  } = db.data.dbai.myanima[m.sender];
  if (m.quoted?.id === keyId && m.text.trim()) {
    m.react(wait);
    try {
      const answer = await MyAnima(m.text.trim());
      const {
        key: { id: newKeyId },
      } = await conn.reply(m.chat, `${answer}`, m);
      db.data.dbai.myanima[m.sender].key.id = newKeyId;
      m.react(sukses);
    } catch (error) {
      console.error("Handler before error:", error);
      m.react(eror);
    }
  }
};
handler.help = ["myanima"];
handler.tags = ["ai"];
handler.command = /^(myanima)$/i;
export default handler;
