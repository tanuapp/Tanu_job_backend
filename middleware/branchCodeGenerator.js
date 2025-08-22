const Company = require("../models/company");

// Давтагдашгүй 2 үсэг + 4 оронтой код үүсгэх
async function generateBranchCode() {
  let code;
  let exists = true;

  while (exists) {
    const letters = Array.from({ length: 2 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = Math.floor(10000 + Math.random() * 90000)
      .toString()
      .slice(0, 4);

    code = `${letters}${numbers}`;

    // Компанид ашиглагдсан эсэхийг шалгана
    exists = await Company.findOne({ branchCode: code });
  }

  return code;
}

module.exports = generateBranchCode;
