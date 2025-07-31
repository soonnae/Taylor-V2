import { fileURLToPath } from "url";
import {
  ffmpeg as ffmpegConv,
  toSticker,
  openwaSticker,
  StickerTypes as _StickerTypes,
  imageToWebp,
  videoToWebp,
  mp42webp,
  png2webp,
} from "./converter.js";
import {
  video2Webp as _video2webp,
  image2Webp as _image2Webp,
} from "./webp2mp4.js";
import uploadFile from "./uploadFile.js";
import uploadImage from "./uploadImage.js";
import { tmpdir } from "os";
import { Sticker, createSticker, StickerTypes } from "wa-sticker-formatter";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import Fluent_Ffmpeg from "fluent-ffmpeg";
import { fileTypeFromBuffer } from "file-type";
import webpmux from "node-webpmux";
const { Image, WebPMux } = webpmux;
import crypto from "crypto";
import { Buffer } from "buffer";
import sharp from "sharp";
const __dirname = path.dirname(fileURLToPath(import.meta.url)),
  tmp = path.join(__dirname, "../tmp");

function sanitizeFilePath(filePath, baseDir) {
  const resolvedPath = path.resolve(baseDir, filePath);
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error("Path traversal attempt detected");
  }
  return resolvedPath;
}

async function sticker6(media, url) {
  try {
    if (url) {
      const res = await fetch(url);
      if (200 !== res.status) throw new Error(await res.text());
      media = await res.arrayBuffer();
    }
    const type = (await fileTypeFromBuffer(Buffer.from(media))) || {
      mime: "application/octet-stream",
      ext: "bin",
    };
    const tmpDir = path.join(__dirname, "../tmp"),
      tmpFile = sanitizeFilePath(`${Date.now()}.${type.ext}`, tmpDir),
      outFile = sanitizeFilePath(`${tmpFile}.webp`, tmpDir);
    return (
      await fs.promises.writeFile(tmpFile, Buffer.from(media)),
      new Promise((resolve, reject) => {
        (/video/i.test(type.mime)
          ? Fluent_Ffmpeg(tmpFile).inputFormat(type.ext)
          : Fluent_Ffmpeg(tmpFile)
        )
          .on("error", async (err) => {
            console.error("FFmpeg error:", err),
              await fs.promises.unlink(tmpFile),
              reject(err);
          })
          .on("end", async () => {
            await fs.promises.unlink(tmpFile);
            const data = await fs.promises.readFile(outFile);
            resolve(data), await fs.promises.unlink(outFile);
          })
          .addOutputOptions([
            "-vcodec",
            "libwebp",
            "-vf",
            "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
            "-lossless",
            "0",
            "-compression_level",
            "6",
            "-qscale",
            "80",
            "-preset",
            "default",
            "-t",
            "00:00:05",
          ])
          .toFormat("webp")
          .save(outFile);
      })
    );
  } catch (e) {
    throw (console.error("Error in sticker6:", e), e);
  }
}

async function convertImage(file, ext1, ext2, options = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const temp = sanitizeFilePath(Date.now() + "." + ext1, path.join(__dirname, "../tmp"));
      const out = sanitizeFilePath(temp + "." + ext2, path.join(__dirname, "../tmp"));
      await fs.promises.writeFile(temp, file);
      await Fluent_Ffmpeg(temp)
        .on("start", (cmd) => {
          console.log(cmd);
        })
        .on("error", (e) => {
          fs.unlinkSync(temp);
          reject(e);
        })
        .on("end", () => {
          console.log("Finish");
          setTimeout(() => {
            fs.unlinkSync(temp);
            fs.unlinkSync(out);
          }, 2e3);
          resolve(fs.readFileSync(out));
        })
        .addOutputOptions(options)
        .toFormat(ext2)
        .save(out);
    } catch (error) {
      reject(error);
    }
  });
}

async function convertVideo(file, ext1, ext2, options = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const temp = sanitizeFilePath(Date.now() + "." + ext1, path.join(__dirname, "../tmp"));
      const out = sanitizeFilePath(temp + "." + ext2, path.join(__dirname, "../tmp"));
      await fs.promises.writeFile(temp, file);
      await Fluent_Ffmpeg(temp)
        .on("start", (cmd) => {
          console.log(cmd);
        })
        .on("error", (e) => {
          fs.unlinkSync(temp);
          reject(e);
        })
        .on("end", () => {
          console.log("Finish");
          setTimeout(() => {
            fs.unlinkSync(temp);
            fs.unlinkSync(out);
          }, 2e3);
          resolve(fs.readFileSync(out));
        })
        .addOutputOptions(options)
        .seekInput("00:00")
        .setDuration("00:05")
        .toFormat(ext2)
        .save(out);
    } catch (error) {
      reject(error);
    }
  });
}

async function video2webp(media) {
  const tmpFileOut = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
      tmpdir()
    ),
    tmpFileIn = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
      tmpdir()
    );
  fs.writeFileSync(tmpFileIn, media),
    await new Promise((resolve, reject) => {
      Fluent_Ffmpeg(tmpFileIn)
        .on("error", reject)
        .on("end", () => resolve(!0))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-ss",
          "00:00:00",
          "-t",
          "00:00:05",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .save(tmpFileOut);
    });
  const buff = fs.readFileSync(tmpFileOut);
  return fs.unlinkSync(tmpFileOut), fs.unlinkSync(tmpFileIn), buff;
}

async function video2webp30(media) {
  const tmpFileOut = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
      tmpdir()
    ),
    tmpFileIn = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
      tmpdir()
    );
  fs.writeFileSync(tmpFileIn, media),
    await new Promise((resolve, reject) => {
      Fluent_Ffmpeg(tmpFileIn)
        .on("error", reject)
        .on("end", () => resolve(!0))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-ss",
          "00:00:00",
          "-t",
          "00:00:05",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .save(tmpFileOut);
    });
  const buff = fs.readFileSync(tmpFileOut);
  return fs.unlinkSync(tmpFileOut), fs.unlinkSync(tmpFileIn), buff;
}

async function video2webp45(media) {
  const tmpFileOut = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
      tmpdir()
    ),
    tmpFileIn = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
      tmpdir()
    );
  fs.writeFileSync(tmpFileIn, media),
    await new Promise((resolve, reject) => {
      Fluent_Ffmpeg(tmpFileIn)
        .on("error", reject)
        .on("end", () => resolve(!0))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-ss",
          "00:00:00",
          "-t",
          "00:00:05",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .save(tmpFileOut);
    });
  const buff = fs.readFileSync(tmpFileOut);
  return fs.unlinkSync(tmpFileOut), fs.unlinkSync(tmpFileIn), buff;
}

async function video2webp60(media) {
  const tmpFileOut = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`,
      tmpdir()
    ),
    tmpFileIn = sanitizeFilePath(
      `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`,
      tmpdir()
    );
  fs.writeFileSync(tmpFileIn, media),
    await new Promise((resolve, reject) => {
      Fluent_Ffmpeg(tmpFileIn)
        .on("error", reject)
        .on("end", () => resolve(!0))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-ss",
          "00:00:00",
          "-t",
          "00:00:05",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .save(tmpFileOut);
    });
  const buff = fs.readFileSync(tmpFileOut);
  return fs.unlinkSync(tmpFileOut), fs.unlinkSync(tmpFileIn), buff;
}

async function sticker(media, url, args) {
  const functionsToTry = [
    sticker6,
    sticker4,
    sticker10,
    sticker11,
    sticker12,
    sticker13,
    sticker3,
    sticker1,
    sticker7,
    sticker9,
    sticker8,
    sticker5,
    sticker2,
  ].filter(Boolean);
  for (let func of functionsToTry) {
    try {
      const result = await Promise.race([
        func(media, url, args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 6e4),
        ),
      ]);
      if (result?.includes("html")) continue;
      if (result?.includes("WEBP"))
        return await addExif(result, args).catch((e) => {
          console.error(e);
          return result;
        });
      throw new Error(result.toString());
    } catch (err) {
      console.error(err);
    }
  }
  return new Error("All functions failed");
}
const support = {
  ffmpeg: !0,
  ffprobe: !0,
  ffmpegWebp: !0,
  convert: !0,
  magick: !1,
  gm: !1,
  find: !1,
};
export {
  sticker,
  sticker1,
  sticker2,
  sticker3,
  sticker4,
  sticker5,
  sticker6,
  sticker7,
  sticker8,
  sticker9,
  sticker10,
  sticker11,
  sticker12,
  sticker13,
  video2webp,
  video2webp30,
  video2webp45,
  video2webp60,
  addExif,
  support,
};
