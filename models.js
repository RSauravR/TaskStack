require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection failed", err));

//schema and models
const userSchema = mongoose.Schema({
    username: String,
    password: String
});

const organizationSchema = mongoose.Schema({
    title: String,
    description: String,
    admin: { type: mongoose.Types.ObjectId, ref: "users" },
    members: [{ type: mongoose.Types.ObjectId, ref: "users" }]   
});

const organizationModel = mongoose.model("organization", organizationSchema);
const userModel = mongoose.model("users", userSchema);

module.exports = {
    organizationModel,
    userModel
}