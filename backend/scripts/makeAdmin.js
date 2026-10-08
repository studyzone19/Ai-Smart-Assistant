require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const makeAdmin = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node makeAdmin.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User ${email} is already an admin.`);
      process.exit(0);
    }

    user.role = "admin";
    await user.save();
    
    console.log(`Success: User ${email} has been granted admin privileges.`);
    process.exit(0);
  } catch (err) {
    console.error("Error making user admin:", err);
    process.exit(1);
  }
};

makeAdmin();
