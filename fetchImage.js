const puppeteer = require("puppeteer");

async function fetchImage(url) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    if (url.startsWith("data:")) {
      // Handle data URLs
      const base64Data = url.split(",")[1];
      const imageBuffer = Buffer.from(base64Data, "base64");
      await browser.close();
      return imageBuffer;
    } else {
      // Handle regular URLs
      await page.goto(url, { waitUntil: "networkidle2" });
      const imageBuffer = await page.screenshot();
      await browser.close();
      return imageBuffer;
    }
  } catch (error) {
    await browser.close();
    throw error;
  }
}

module.exports = fetchImage;
