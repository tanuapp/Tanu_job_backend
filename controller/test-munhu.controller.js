const Artist=require("../models/artistModel")
const CustomerOrder=require("../models/cusstomerOrderModel")
const Service=require("../models/serviceModel")
const asyncHandler=require("../middleware/asyncHandler")

exports.change = asyncHandler(async (req, res, next) => {
    try {
      const {artistId , ognoo}=req.body
      
      //artists
      const artist=await Artist.findById(artistId)
      const artistItems=artist.item

      //customer orders
      const customerOrders=await CustomerOrder.find()

      let newList = [];

      // for (const order of customerOrders) {
      //   if (ognoo === order?.ognoo?.split("T")[0]) {  
      //     console.log(ognoo==order.ognoo.split("T")[0])
      //     for (const item of artistItems) {
      //       if (order?.ognoo?.split("T")[1] != item?.huwaari?.split(" ")[0]) {
      //         console.log("order ognoo:",order?.ognoo?.split("T")[1] , "item huwaari:",item?.huwaari?.split(" ")[0])
      //         // console.log("orj bga", item)
      //         if(!newList.includes(item)){
      //           newList.push(item)
      //         }
      //       }
      //     }
      //   }
      // }
      for(const item of artistItems){
       for(const order of customerOrders){
        if(order?.ognoo?.split("T")[1]!=item?.huwaari?.split(" ")[0] && ognoo==order?.ognoo?.split("T")[0]){
          newList.push(item)
        }
       }
      }
      res.json({newList})
     
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });