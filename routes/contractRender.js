const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");

router.post(
  "/render-pdf",
  asyncHandler(async (req, res) => {
    const { html: base64Html, meta } = req.body;

    console.log("🚀 [PDF RENDER] Шинэ хүсэлт ирлээ");
    console.log("➡️ [PDF RENDER] Meta:", JSON.stringify(meta, null, 2));

    if (!base64Html) {
      console.error("❌ [PDF RENDER] HTML өгөгдөл ирээгүй");
      return res.status(400).json({ error: "HTML өгөгдөл шаардлагатай" });
    }

    let html;
    try {
      html = Buffer.from(base64Html, "base64").toString("utf-8");
      console.log(
        "✅ [PDF RENDER] HTML амжилттай decode хийлээ, урт:",
        html.length
      );

      console.log(
        "✅ [PDF RENDER] HTML амжилттай decode хийлээ, урт:",
        html.length
      );
    } catch (decodeErr) {
      console.error("❌ [PDF RENDER] HTML decode хийхэд алдаа:", decodeErr);
      return res
        .status(500)
        .json({ success: false, error: "HTML decode хийхэд алдаа гарлаа" });
    }

    try {
      console.log("🚀 [PDF RENDER] Puppeteer эхэлж байна...");
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"],
      });
      const page = await browser.newPage();

      console.log("📄 [PDF RENDER] HTML ачаалж байна...");
      await page.setContent(html, { waitUntil: "networkidle0" });
      console.log("✅ [PDF RENDER] HTML ачаагдлаа!");

      console.log("🖨️ [PDF RENDER] PDF үүсгэж байна...");
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      });
      await browser.close();
      console.log("✅ [PDF RENDER] PDF үүсгэгдлээ!");

      const sanitizeFilename = (name) => {
        return name.replace(/[^a-zA-Z0-9-_]/g, "_"); // зөвшөөрөгдсөн тэмдэгтүүд
      };

      const contractNumber = sanitizeFilename(
        meta?.contractNumber || Date.now().toString()
      );
      const filename = `contract-${contractNumber}.pdf`;

      const filePath = path.join(__dirname, "../public/uploads", filename);

      console.log("💾 [PDF RENDER] Файлыг хадгалж байна:", filePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);

      const publicUrl = `https://api.tanusoft.mn/uploads/${filename}`;
      console.log("✅ [PDF RENDER] Амжилттай! Public URL:", publicUrl);

      return res.status(200).json({
        success: true,
        url: publicUrl,
      });
    } catch (error) {
      console.error("❌ [PDF RENDER] PDF үүсгэхэд алдаа:", error);
      return res
        .status(500)
        .json({ success: false, error: "PDF үүсгэж чадсангүй" });
    }
  })
);

module.exports = router;
