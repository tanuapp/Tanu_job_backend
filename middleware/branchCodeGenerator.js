const Company = require("../models/company");

// Давтагдашгүй 2 үсэг + 4 оронтой код үүсгэх
async function generateBranchCode() {
  let code;
  let exists = true;

  while (exists) {
    // 2 үсэг
    const letters = Array.from({ length: 2 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");

    // 4 оронтой тоо (0001 - 9999 хүртэл)
    const numbers = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    code = `${letters}${numbers}`;

    // Компанид ашиглагдсан эсэхийг шалгана
    exists = await Company.exists({ branchCode: code });
  }

  return code;
}

module.exports = generateBranchCode;
