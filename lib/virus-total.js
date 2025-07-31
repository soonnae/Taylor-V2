import axios from "axios";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";
const VIRUS_TOTAL_API_KEY =
    process.env.VIRUS_TOTAL_API_KEY,
  VirusTotal = async (buffer) => {
    try {
      const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {},
        form = new FormData(),
        blob = new Blob([buffer.toArrayBuffer()], {
          type: mime,
        });
      form.append("name", `virustotal.${ext}`),
        form.append("file", blob, `virustotal.${ext}`),
        form.append("apikey", VIRUS_TOTAL_API_KEY);
      const options = {
        method: "post",
        url: "https://www.virustotal.com/vtapi/v2/file/scan",
        data: form,
      };
      return (await axios(options)).data;
    } catch (error) {
      throw new Error(`VirusTotal scan failed: ${error.message}`);
    }
  },
  LookUp = async (sample_hash) => {
    try {
      const reportParams = {
        apikey: VIRUS_TOTAL_API_KEY,
        resource: sample_hash,
      };
      return (
        await axios.get("https://www.virustotal.com/vtapi/v2/file/report", {
          params: reportParams,
        })
      ).data;
    } catch (error) {
      throw new Error(`VirusTotal lookup failed: ${error.message}`);
    }
  };
export { VirusTotal, LookUp };
