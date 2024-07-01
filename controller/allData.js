// const model1 = require("../models/officeModel");
// const model2 = require("../models/apartmentModel");
// const model3 = require("../models/garageModel");
// const model4 = require("../models/houseModel");
// const model5 = require("../models/negUdriinBaishin");
// const model6 = require("../models/talbaiModel");
// const model7 = require("../models/gazarModel");

// const asyncHandler = require("../middleware/asyncHandler");

// exports.getAll = asyncHandler(async (req, res, next) => {
//   try {
//     // Fetch data from all models concurrently
//     const data1 = model1.find();
//     const data2 = model2.find();
//     const data3 = model3.find();
//     const data4 = model4.find();
//     const data5 = model5.find();
//     const data6 = model6.find();
//     const data7 = model7.find();

//     const [result1, result2, result3, result4, result5, result6, result7] =
//       await Promise.all([data1, data2, data3, data4, data5, data6, data7]);

//     const combinedData = {
//       model1: result1,
//       model2: result2,
//       model3: result3,
//       model4: result4,
//       model5: result5,
//       model6: result6,
//       model7: result7
//     };

//     const total = Object.values(combinedData).reduce(
//       (acc, cur) => acc + cur.length,
//       0
//     );
//     return res
//       .status(200)
//       .json({ success: true, total: total, data: combinedData });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });
