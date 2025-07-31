import CryptoJS from "crypto-js";
import axios from "axios";
const ke = {
  J2DOWN_SECRET: process.env.J2DOWN_SECRET, // Use environment variable
};
export const socialDl = async (url) => {
  const isURL = /^http(|s):\/\//.test(url);
  if (!isURL) return "Invalid URL";
  const encryptor = new MyEncryptor();
  const encryptedUri = encryptor.getUri(url);
  try {
    const response = await axios.post(
      "https://api.zm.io.vn/v1/social/autolink",
      {
        data: encryptedUri,
      },
      {
        headers: {
          "Content-Type": "application/json",
          token: process.env.API_TOKEN, // Use environment variable
          apikey: process.env.API_KEY,  // Use environment variable
        },
      },
    );
    const data = response.data;
    return data;
  } catch (error) {
    return `Error: ${error.response ? error.response.data : error.message}`;
  }
};
class MyEncryptor {
  secretKey() {
    const decrypted = CryptoJS.AES.decrypt(ke.J2DOWN_SECRET, "manhg-api");
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
  getUri(url) {
    const data = {
      url: url,
      unlock: true,
    };
    const secretKey = this.secretKey();
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      secretKey,
    ).toString();
    return encrypted;
  }
}
