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

const boardSchema = mongoose.Schema({
    title: String,
    organizationId: {type: mongoose.Types.ObjectId, ref: "organization"}
});

const issueSchema = mongoose.Schema({
    title: String,
    boardId: {type: mongoose.Types.ObjectId, ref: "board"},
     status: { 
        type: String, 
        enum: ["todo", "in-progress", "done"],
        default: "todo"
    }
});

const organizationModel = mongoose.model("organization", organizationSchema);
const userModel = mongoose.model("users", userSchema);
const boardModel = mongoose.model("board", boardSchema);
const issueModel = mongoose.model("issue", issueSchema);

module.exports = {
    organizationModel,
    userModel,
    boardModel,
    issueModel
}