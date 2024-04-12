const mongoose = require("mongoose");
const { Schema } = mongoose;

const companySchema = new Schema({
  companyName: {
    type: String,
  },
  photo: {
    type: String,
  },
  description :{
    type: String,
    required: [true, "Компаний танилцууллага хоосон байж болохгүй"],
    maxlength: [200, "Компаний танилцууллага   хамгийн уртдаа 300 тэмдэгт байна  сонгоно уу!"],
  },
  open : {  type : String} ,
  close : { type : String} ,
  code : {
    type : Number
  } ,
  companyCreater : { 
    type : Schema.Types.ObjectId,
    ref : "User"
  } ,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Company", companySchema);
