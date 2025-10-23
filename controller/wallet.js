const Wallet = require("../models/wallet");
const Freelancer = require("../models/freelancer");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

// Import bank data from corporate.js
const bankData = [
  { bankName: "Ариг банк", code: "210000" },
  { bankName: "Богд банк", code: "380000" },
  { bankName: "Голомт банк", code: "150000" },
  { bankName: "Капитрон банк", code: "300000" },
  { bankName: "М Банк", code: "390000" },
  { bankName: "Төрийн банк", code: "340000" },
  { bankName: "Тээвэр хөгжлийн банк", code: "190000" },
  { bankName: "Үндэсний хөрөнгө оруулалтын банк", code: "290000" },
  { bankName: "Хаан банк", code: "050000" },
  { bankName: "Хас банк", code: "320000" },
  { bankName: "Хөгжлийн банк", code: "360000" },
  { bankName: "Худалдаа хөгжлийн банк", code: "040000" },
  { bankName: "Чингис хаан банк", code: "330000" },
  { bankName: "Капитал банк ЭХА", code: "030000" },
  { bankName: "Сангийн яам (Төрийн сан)", code: "900000" },
  { bankName: "Үнэт цаасны төвлөрсөн хадгаламжийн төв", code: "950000" },
  { bankName: "Монголын үнэт цаасны клирингийн төв", code: "940000" },
  { bankName: "Ард кредит ББСБ", code: "520000" },
  { bankName: "Дата бэйнк", code: "550000" },
  { bankName: "Инвескор Хэтэвч ББСБ", code: "530000" },
  { bankName: "Мобифинанс ББСБ", code: "500000" },
  { bankName: "Хай пэймэнт солюшнс", code: "510000" },
  { bankName: "Монгол банк", code: "010000" },
];

// Helper function to get bank code from corporate data
const getBankCode = (bankName) => {
  const bank = bankData.find((b) => b.bankName === bankName);
  return bank ? bank.code : null;
};

// ✅ Get all wallets
exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allWallets = await Wallet.find()
      .populate("freelancerId", "first_name last_name phone")
      .sort({ createdAt: -1 });
    const total = await Wallet.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allWallets,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Get wallet by freelancer ID
exports.getByFreelancerId = asyncHandler(async (req, res, next) => {
  try {
    const { freelancerId } = req.params;

    const wallet = await Wallet.findOne({ freelancerId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Get current user's wallet
exports.getMyWallet = asyncHandler(async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх шаардлагатай",
      });
    }

    const wallet = await Wallet.findOne({ freelancerId: req.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Create wallet for freelancer
exports.create = asyncHandler(async (req, res, next) => {
  try {
    const { freelancerId, banks, bankNumber, bankOwner } = req.body;

    // Check if freelancer exists
    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: "Freelancer олдсонгүй",
      });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ freelancerId });
    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: "Хэтэвч аль хэдийн үүссэн байна",
      });
    }

    const inputData = {
      freelancerId,
      banks,
      bankNumber,
      bankOwner,
      balance: 0,
      currency: "MNT",
      status: "active",
      transactions: [],
      totalEarnings: 0,
      totalWithdrawals: 0,
      isActive: true,
    };

    const wallet = await Wallet.create(inputData);

    res.status(200).json({
      success: true,
      message: "Хэтэвч амжилттай үүсгэгдлээ",
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Update wallet
exports.update = asyncHandler(async (req, res, next) => {
  try {
    const { banks, bankNumber, bankOwner, status } = req.body;

    const updatedData = {
      ...req.body,
    };

    const updatedWallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    ).populate("freelancerId", "first_name last_name phone");

    if (!updatedWallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      message: "Хэтэвч амжилттай шинэчлэгдлээ",
      data: updatedWallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Get wallet by ID
exports.get = asyncHandler(async (req, res, next) => {
  try {
    const wallet = await Wallet.findById(req.params.id).populate(
      "freelancerId",
      "first_name last_name phone"
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Delete wallet
exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const deletedWallet = await Wallet.findByIdAndDelete(req.params.id);

    if (!deletedWallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      message: "Хэтэвч амжилттай устгагдлаа",
      data: deletedWallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Add transaction to wallet
exports.addTransaction = asyncHandler(async (req, res, next) => {
  try {
    const { type, amount, description, serviceId, invoiceId, companyId } =
      req.body;

    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: "Транзакцийн мэдээлэл дутуу байна",
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    const transactionData = {
      type,
      amount,
      description,
      serviceId,
      invoiceId,
      companyId,
      status: "completed",
      createdAt: new Date(),
    };

    await wallet.addTransaction(transactionData);

    res.status(200).json({
      success: true,
      message: "Транзакц амжилттай нэмэгдлээ",
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Get transaction history
exports.getTransactionHistory = asyncHandler(async (req, res, next) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    const transactions = wallet.getTransactionHistory(
      parseInt(limit),
      parseInt(skip)
    );

    res.status(200).json({
      success: true,
      count: wallet.transactions.length,
      data: transactions,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Top-up wallet account
exports.topup = asyncHandler(async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Зөв дүн оруулна уу",
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    if (wallet.status !== "active" || !wallet.isActive) {
      return res.status(400).json({
        success: false,
        message: "Хэтэвч идэвхгүй байна",
      });
    }

    const transactionData = {
      type: "credit",
      amount,
      description: description || "Хэтэвчэнд мөнгө нэмэх",
      status: "completed",
      createdAt: new Date(),
    };

    await wallet.addTransaction(transactionData);

    res.status(200).json({
      success: true,
      message: "Мөнгө амжилттай нэмэгдлээ",
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Withdraw money from wallet
exports.withdraw = asyncHandler(async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Зөв дүн оруулна уу",
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    if (!wallet.canWithdraw(amount)) {
      return res.status(400).json({
        success: false,
        message: "Үлдэгдэл хүрэлцэхгүй эсвэл хэтэвч идэвхгүй байна",
      });
    }

    const transactionData = {
      type: "withdrawal",
      amount,
      description: description || "Банкны данс руу шилжүүлэлт",
      status: "completed",
      createdAt: new Date(),
    };

    await wallet.addTransaction(transactionData);

    res.status(200).json({
      success: true,
      message: "Мөнгө амжилттай татагдлаа",
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Get wallet balance
exports.getBalance = asyncHandler(async (req, res, next) => {
  try {
    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId }).select(
      "balance currency totalEarnings totalWithdrawals"
    );
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawals: wallet.totalWithdrawals,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Set bank information (only one bank info allowed)
exports.setBankInfo = asyncHandler(async (req, res, next) => {
  try {
    const { banks, bankNumber, bankOwner } = req.body;

    // Validate required fields
    if (!banks || !bankNumber || !bankOwner) {
      return res.status(400).json({
        success: false,
        message: "Банкны мэдээлэл дутуу байна",
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    // Set bank information
    wallet.banks = banks;
    wallet.bankNumber = bankNumber;
    wallet.bankOwner = bankOwner;
    wallet.bankCode = getBankCode(banks); // Automatically set bank code
    wallet.hasBankInfo = true;

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Банкны мэдээлэл амжилттай хадгалагдлаа",
      data: {
        banks: wallet.banks,
        bankNumber: wallet.bankNumber,
        bankOwner: wallet.bankOwner,
        bankCode: wallet.bankCode,
        hasBankInfo: wallet.hasBankInfo,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Update bank information
exports.updateBankInfo = asyncHandler(async (req, res, next) => {
  try {
    const { banks, bankNumber, bankOwner } = req.body;

    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    if (!wallet.hasBankInfo) {
      return res.status(400).json({
        success: false,
        message:
          "Банкны мэдээлэл байхгүй байна. Эхлээд банкны мэдээлэл оруулна уу",
      });
    }

    // Update only provided fields
    if (banks) {
      wallet.banks = banks;
      wallet.bankCode = getBankCode(banks); // Automatically update bank code
    }
    if (bankNumber) wallet.bankNumber = bankNumber;
    if (bankOwner) wallet.bankOwner = bankOwner;

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Банкны мэдээлэл амжилттай шинэчлэгдлээ",
      data: {
        banks: wallet.banks,
        bankNumber: wallet.bankNumber,
        bankOwner: wallet.bankOwner,
        bankCode: wallet.bankCode,
        hasBankInfo: wallet.hasBankInfo,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Remove bank information
exports.removeBankInfo = asyncHandler(async (req, res, next) => {
  try {
    // Find user's wallet
    const wallet = await Wallet.findOne({ freelancerId: req.userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    if (!wallet.hasBankInfo) {
      return res.status(400).json({
        success: false,
        message: "Устгах банкны мэдээлэл байхгүй байна",
      });
    }

    // Remove bank information
    wallet.banks = null;
    wallet.bankNumber = null;
    wallet.bankOwner = null;
    wallet.bankCode = null;
    wallet.hasBankInfo = false;

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "Банкны мэдээлэл амжилттай устгагдлаа",
      data: {
        hasBankInfo: wallet.hasBankInfo,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

// ✅ Suspend/Activate wallet
exports.updateStatus = asyncHandler(async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Зөв статус оруулна уу",
      });
    }

    const wallet = await Wallet.findByIdAndUpdate(
      walletId,
      { status },
      { new: true }
    ).populate("freelancerId", "first_name last_name phone");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Хэтэвч олдсонгүй",
      });
    }

    res.status(200).json({
      success: true,
      message: `Хэтэвч ${
        status === "active" ? "идэвхжүүлэгдлээ" : "идэвхгүй болгогдлоо"
      }`,
      data: wallet,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
