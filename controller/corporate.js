exports.banks = asyncHandler(async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: [
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
      ],
    });
    // const text = await model.create(data);
    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
