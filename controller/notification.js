const apn = require("apn");
const path = require("path");
const asyncHandler = require("../middleware/asyncHandler");
const apnService = require("../utils/apnService");
const User = require("../models/customer");
const customResponse = require("../utils/customResponse");

exports.send = asyncHandler(async (req, res, next) => {
  try {
    const { deviceTokens, alertMessage } = req.body;
    const result = await apnService.sendNotification(
      deviceTokens,
      alertMessage
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        failedTokens: result.failedTokens,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.sendMass = asyncHandler(async (req, res, next) => {
  try {
    const list = await User.find({
      isAndroid: false,
    });
    const availableTokens = list.map((list) => list.firebase_token);
    const { alertMessage } = req.body;
    const result = await apnService.sendNotification(
      availableTokens,
      alertMessage
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        failedTokens: result.failedTokens,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.sendFirebase = asyncHandler(async (req, res, next) => {
  try {
    
    console.log("req only user to whom");

    // const { deviceTokens, alertMessage } = req.body;
    // const result = await apnService.sendNotification(
    //   deviceTokens,
    //   alertMessage
    // ); 
    const getUsersToSendNotification = await User.find("");
    const message = {
            notification: {
              title: request.body.data.title,
              body: request.body.data.description
            },
            android: {
              "notification": {
                "sound": "default"
              }
            },
            apns: {
              "payload": {
                "aps": {
                  "sound": "default"
                }
              }
            },
            data: request.body.data,
            topic: topic
    };
    global.fireadmin
        .messaging()
        .send(message)
        .then((res) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", res);
        })
        .catch((err) => {
          console.log("Error sending message:", err);
        });
    
    if (result.success) {
      res.status(200).json({
        success: true,
        failedTokens: result.failedTokens,
      });
    }
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
//  this.app.post('/api/notification/create', [auth, get_user], notificationHandler.createNotification);
  
// /*
//  * @author Janibyek Manakhmyet
//  */

// // import axios from "axios";

// class NotificationHandler {
//   async createNotification(request, response) {
//     try {
//       request.body.table = "notifications"
//       let obj: any = {};
//       console.log(request.body.data)
//       if (request.body.data._id) {
//         obj = await queryHandler.updateData("notifications", request.body.data);
//       } else {
//         obj = await queryHandler.createData(request.body);
//       }
//       if (request.body.data.state) {
//         request.body.data.topics.forEach(topic => {
//           const message = {
//             notification: {
//               title: request.body.data.title,
//               body: request.body.data.description
//             },
//             android: {
//               "notification": {
//                 "sound": "default"
//               }
//             },
//             apns: {
//               "payload": {
//                 "aps": {
//                   "sound": "default"
//                 }
//               }
//             },
//             // data: request.body.data
//             topic: topic
//           };
//           console.log(message);
//           console.log("is topics")
//           global.fireadmin.messaging().send(message)
//             .then((res) => {
//               console.log("Successfully sent message:", res);
//             })
//             .catch((err) => {
//               console.log("Error sending message:", err);
//             });
//         });
//       }
//       console.log(request.body.data)
//       if (request.body.data.test) {
//         const message = {
//           notification: {
//             title: request.body.data.title,
//             body: request.body.data.description
//           },
//           token: request.body.data.token,
//           android: {
//             "notification": {
//               "sound": "default"
//             }
//           },
//           apns: {
//             "payload": {
//               "aps": {
//                 "sound": "default"
//               }
//             }
//           },
//         };
//         global.fireadmin
//           .messaging()
//           .send(message)
//           .then((res) => {
//             // Response is a message ID string.
//             console.log("Successfully sent message:", res);
//           })
//           .catch((err) => {
//             console.log("Error sending message:", err);
//           });
//       }
//       console.log("meessgea send");
//       if (obj) {
//         response.status(200).json({
//           data: obj,
//           error: false,
//           message: SUCCESS,
//         });
//       } else {
//         response.status(200).json({
//           error: true,
//           message: "Notification create error",
//         });
//       }
//     } catch (error) {
//       response.status(SERVER_NOT_FOUND_HTTP_CODE).json({
//         error: true,
//         message: SERVER_ERROR_MESSAGE,
//       });
//     }
//   }


// }

// export default new NotificationHandler();