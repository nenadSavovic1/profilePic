const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    ? process.env.CLOUDINARY_CLOUD_NAME
    : "dwbhswbiz",
  api_key: process.env.CLOUDINARY_API_KEY
    ? process.env.CLOUDINARY_API_KEY
    : "792749484157584",
  api_secret: process.env.CLOUDINARY_API_SECRET
    ? process.env.CLOUDINARY_API_SECRET
    : "6_reYo3Wica1s1N1GMsVALYHzBo",
});

const app = express();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static("public"));

app.post("/upload", upload.single("profile"), async (req, res) => {
  const overlayPath = path.join(__dirname, "public", "overlay.png");

  try {
    const profileBuffer = req.file.buffer;
    const profileMetadata = await sharp(profileBuffer).metadata();

    const overlayBuffer = await sharp(overlayPath)
      .resize({
        width: profileMetadata.width,
        height: profileMetadata.height,
        fit: "inside",
      })
      .toBuffer();

    const finalImage = await sharp(profileBuffer)
      .resize({
        width: profileMetadata.width,
        height: profileMetadata.height,
        fit: "inside",
      })
      .composite([{ input: overlayBuffer, blend: "over" }])
      .toBuffer();

    // Upload the final image to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "uploads", format: "png" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).send("Cloudinary upload failed");
        }
        console.log("Uploaded image URL:", result.secure_url); // Log the URL
        res.send({ imageUrl: result.secure_url });
      }
    );

    streamifier.createReadStream(finalImage).pipe(uploadStream);
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
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
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
