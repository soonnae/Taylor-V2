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
    throw new Error("Path traversal detected");
  }
  return resolvedPath;
}

async function sticker2(media, url) {
  try {
    if (url) {
      const res = await fetch(url);
      if (200 !== res.status) throw new Error(await res.text());
      media = await res.arrayBuffer();
    }
    const inp = sanitizeFilePath(path.join(tmp, `${Date.now()}.jpeg`), tmp);
    await fs.promises.writeFile(inp, Buffer.from(media));
    const ffmpegSpawn = spawn("ffmpeg", [
      "-y",
      "-i",
      inp,
      "-vf",
      "scale='iw*min(512/iw\\,512/ih):ih*min(512/iw\\,512/ih)':force_original_aspect_ratio=decrease,fps=15,pad='512:512:(512-iw*min(512/iw\\,512/ih))/2:(512-ih*min(512/iw\\,512/ih))/2':color=#00000000,setsar=1",
      "-f",
      "webp",
      "-",
    ]);
    ffmpegSpawn.on("error", (err) => {
      throw new Error(`FFmpeg error: ${err.message}`);
    });
    const ffBuffer = await new Promise((resolve, reject) => {
      const bufs = [];
      ffmpegSpawn.stdout.on("data", (chunk) => bufs.push(chunk)),
        ffmpegSpawn.stdout.on("end", () => resolve(Buffer.concat(bufs))),
        ffmpegSpawn.stderr.on("data", (err) =>
          reject(new Error(`FFmpeg stderr: ${err.toString()}`)),
        );
    });
    await fs.promises.unlink(inp);
    const imArgs = [
        ...(module.exports.support.gm
          ? ["gm"]
          : module.exports.magick
            ? ["magick"]
            : []),
        "convert",
        "png:-",
        "webp:-",
      ],
      im = spawn(imArgs[0], imArgs.slice(1));
    im.on("error", (err) => {
      throw new Error(`ImageMagick error: ${err.message}`);
    });
    const imBuffer = await new Promise((resolve, reject) => {
      const bufs = [];
      im.stdout.on("data", (chunk) => bufs.push(chunk)),
        im.stdout.on("end", () => resolve(Buffer.concat(bufs))),
        im.stdin.on("error", (err) =>
          reject(new Error(`ImageMagick stdin error: ${err.message}`)),
        ),
        im.stderr.on("data", (err) =>
          reject(new Error(`ImageMagick stderr: ${err.toString()}`)),
        ),
        im.on("close", (code) => {
          0 !== code &&
            reject(new Error(`ImageMagick exited with code ${code}`));
        });
    });
    return im.stdin.write(ffBuffer), im.stdin.end(), imBuffer;
  } catch (e) {
    throw (console.error("Error in sticker2:", e), e);
  }
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
      tmpFile = sanitizeFilePath(path.join(tmpDir, `${Date.now()}.${type.ext}`), tmpDir),
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
      const temp = sanitizeFilePath(path.join(__dirname, "../tmp", Date.now() + "." + ext1), tmp),
            out = sanitizeFilePath(temp + "." + ext2, tmp);
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
      const temp = sanitizeFilePath(path.join(__dirname, "../tmp", Date.now() + "." + ext1), tmp),
            out = sanitizeFilePath(temp + "." + ext2, tmp);
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
