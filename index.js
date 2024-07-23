const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const puppeteer = require("puppeteer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/upload", upload.single("profile"), async (req, res) => {
  const filePath = req.file.path;
  const overlayPath = path.join(__dirname, "public", "overlay.png");
  const outputPath = path.join(
    __dirname,
    "uploads",
    "profile_with_overlay.png"
  );

  try {
    const profileMetadata = await sharp(filePath).metadata();
    const overlayBuffer = await sharp(overlayPath)
      .resize({
        width: profileMetadata.width,
        height: profileMetadata.height,
        fit: "inside",
      })
      .toBuffer();

    await sharp(filePath)
      .resize({
        width: profileMetadata.width,
        height: profileMetadata.height,
        fit: "inside",
      })
      .composite([{ input: overlayBuffer, blend: "over" }])
      .toFile(outputPath);

    res.download(outputPath, "profile_with_overlay.png", (err) => {
      if (err) {
        return res.status(500).send("Error downloading image");
      }
      fs.unlinkSync(filePath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).send("Error processing image");
  }
});

app.get("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send("URL is required");
  }

  try {
    const imageBuffer = await fetchImage(url);
    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error("Error fetching image:", error.message);
    res.status(500).send("Error fetching image");
  }
});

async function fetchImage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const imageBuffer = await page.screenshot();
    await browser.close();
    return imageBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
