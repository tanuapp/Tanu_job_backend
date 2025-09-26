const mongoose = require("mongoose");
const { Schema } = mongoose;

const freelancerWalletSchema = new Schema(
  {
    freelancerId: {
      type: Schema.Types.ObjectId,
      ref: "Freelancer",
      required: [true, "Freelancer ID заавал бичнэ үү!"],
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Үлдэгдэл сөрөг байж болохгүй!"],
    },
    currency: {
      type: String,
      default: "MNT",
      enum: ["MNT", "USD"],
    },
    status: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit", "refund", "withdrawal", "commission"],
          required: true,
        },
        amount: {
          type: Number,
          required: [true, "Дүн заавал бичнэ үү!"],
          min: [0, "Дүн сөрөг байж болохгүй!"],
        },
        description: {
          type: String,
          required: [true, "Тайлбар заавал бичнэ үү!"],
        },
        appointmentId: {
          type: Schema.Types.ObjectId,
          ref: "Appointment",
        },
        invoiceId: {
          type: Schema.Types.ObjectId,
          ref: "Invoice",
        },
        companyId: {
          type: Schema.Types.ObjectId,
          ref: "Company",
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "cancelled"],
          default: "completed",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, "Нийт орлого сөрөг байж болохгүй!"],
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: [0, "Нийт татан авалт сөрөг байж болохгүй!"],
    },
    lastTransactionDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ Pre-save middleware to update lastTransactionDate
freelancerWalletSchema.pre("save", function (next) {
  if (this.transactions && this.transactions.length > 0) {
    const lastTransaction = this.transactions[this.transactions.length - 1];
    this.lastTransactionDate = lastTransaction.createdAt;
  }
  next();
});

// ✅ Method to add transaction
freelancerWalletSchema.methods.addTransaction = function (transactionData) {
  this.transactions.push(transactionData);
  
  // Update balance based on transaction type
  if (transactionData.type === "credit" || transactionData.type === "refund") {
    this.balance += transactionData.amount;
    this.totalEarnings += transactionData.amount;
  } else if (transactionData.type === "debit" || transactionData.type === "withdrawal") {
    this.balance -= transactionData.amount;
    if (transactionData.type === "withdrawal") {
      this.totalWithdrawals += transactionData.amount;
    }
  }
  
  return this.save();
};

// ✅ Method to check if sufficient balance for withdrawal
freelancerWalletSchema.methods.canWithdraw = function (amount) {
  return this.balance >= amount && this.status === "active" && this.isActive;
};

// ✅ Method to get transaction history with pagination
freelancerWalletSchema.methods.getTransactionHistory = function (limit = 10, skip = 0) {
  return this.transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(skip, skip + limit);
};

// ✅ Static method to find wallet by freelancer ID
freelancerWalletSchema.statics.findByFreelancerId = function (freelancerId) {
  return this.findOne({ freelancerId }).populate("freelancerId", "first_name last_name phone");
};

// ✅ Index for better performance
freelancerWalletSchema.index({ freelancerId: 1 });
freelancerWalletSchema.index({ "transactions.createdAt": -1 });
freelancerWalletSchema.index({ status: 1 });

module.exports = mongoose.model("FreelancerWallet", freelancerWalletSchema);
