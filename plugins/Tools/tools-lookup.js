import fetch from "node-fetch";
const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw "Masukkan Domain/Sub Domain! 😕\n\n*Contoh:* s.id";
  if (text.includes("https://") || text.includes("http://"))
    throw "Tolong masukkan domain/sub domain secara lengkap. Contoh: s.id";
  m.reply("⌛ Mohon tunggu sebentar ya...");
  try {
    let output = await convertRecords(text);
    m.reply(`📋 *DNS Lookup Results:*\n${output}`);
  } catch (error) {
    console.log(error),
      m.reply("❌ Terjadi kesalahan saat melakukan pencarian DNS.");
  }
};
(handler.command = ["dnslookup", "lookup", "dns"]),
  (handler.help = ["dnslookup", "lookup", "dns"]),
  (handler.tags = ["internet"]),
  (handler.premium = !1);
export default handler;
const api_key = process.env.API_KEY; // Use environment variable for API key
async function fetchDNSRecords(apiKey, domain) {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/dnslookup?domain=${domain}`,
      {
        headers: {
          "X-Api-Key": apiKey,
        },
        contentType: "application/json",
      },
    );
    return await response.json();
  } catch (error) {
    throw (console.log(error), new Error("❌ Gagal mengambil rekaman DNS."));
  }
}
async function fetchDNSRecordsFromHackertarget(domain) {
  try {
    const response = await fetch(
      `https://api.hackertarget.com/dnslookup/?q=${domain}`,
    );
    return await response.text();
  } catch (error) {
    throw (
      (console.log(error),
      new Error("❌ Gagal mengambil rekaman DNS dari hackertarget."))
    );
  }
}
async function convertRecords(domain) {
  try {
    return (await fetchDNSRecords(api_key, domain))
      .map(
        (record, index) =>
          `🔍 [${index + 1}]:\n${Object.entries(record)
            .map(([key, value]) => {
              const input = key;
              return `*${input.charAt(0).toUpperCase() + input.slice(1).replace(/_/g, " ")}:* ${"string" == typeof value ? value.replace(/\.$/, "") : value}`;
            })
            .join("\n")}`,
      )
      .join("\n");
  } catch (error) {
    return console.log(error), await fetchDNSRecordsFromHackertarget(domain);
  }
}
