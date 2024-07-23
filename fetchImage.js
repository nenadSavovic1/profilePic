const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function fetchImage(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const imageBuffer = await page.screenshot(); // Capture the screenshot of the image

    await browser.close();
    return imageBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Example usage
const imageUrl =
  "https://media.licdn.com/dms/image/D4E03AQFDMdRaELpsFw/profile-displayphoto-shrink_800_800/0/1721305313334?e=1727308800&v=beta&t=64FldIbhrzxLE_hMRZcQX2nxqIenSDSazW8_cPABK44";
fetchImage(imageUrl)
  .then((buffer) => {
    const filePath = path.join(__dirname, "profile_image.png");
    fs.writeFileSync(filePath, buffer);
    console.log("Image saved to", filePath);
  })
  .catch((error) => {
    console.error("Error fetching image:", error);
  });
