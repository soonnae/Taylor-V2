import { createHash } from "crypto";
const handler = async function (m, { args }) {
  if (!args[0]) throw "Serial Number kosong";
  let user = db.data.users[m.sender],
    sn = createHash("sha256").update(m.sender).digest("hex");
  if (args[0] !== sn) throw "Serial Number salah";
  (user.registered = !1), m.reply("
