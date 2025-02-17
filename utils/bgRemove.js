const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

async function removeBackground(name, retries = 3) {
  const inputPath = path.join(__dirname, `../public/uploads/${name}`);
  const outputPath = path.join(__dirname, `../public/uploads/${name}`);

  try {
    // Check if the output file exists and delete it

    // Prepare form data
    const form = new FormData();
    form.append("image_file", fs.createReadStream(inputPath));

    // Make the API request using Axios
    const response = await axios.post(
      "https://sdk.photoroom.com/v1/segment",
      form,
      {
        headers: {
          "x-api-key": "sandbox_e3ec83f9013fc7832d389318246406a4aa7cc202",
          Accept: "image/png, application/json",
          ...form.getHeaders(),
        },
        responseType: "arraybuffer", // To handle binary data
      }
    );

    // Save the new image
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath); // Remove the old file
      console.log("🗑️ Previous image removed.");
    }
    fs.writeFileSync(outputPath, response.data);
    console.log("✅ Image saved!");
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... Attempts left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return removeBackground(name, retries - 1); // Retry the function
    }
    console.error("❌ Error removing background:", error.message);
  }
}

module.exports = { removeBackground };
