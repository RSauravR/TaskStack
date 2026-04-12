const express = require("express");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("./middleware/auth");
const { organizationAdminMiddleware } = require("./middleware/organizationAdmin");
const { organizationMemberOrAdminMiddleware } = require("./middleware/organizationMemberOrAdmin");
const { boardOrganizationMemberOrAdminMiddleware } = require("./middleware/boardOrganizationMemberOrAdmin");
const {userModel, organizationModel, boardModel, issueModel} = require("./models");

const app = express();
app.use(express.json());

//CREATE
app.post("/signup", async (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = await userModel.findOne({
    username: username,
  })
  if(userExists){
    res.status(409).json({
      message: "user with this user name exist"
    });
    return;
  }

  const newUser = await userModel.create({
    username: username,
    password: password
  })

  res.json({
    id: newUser._id,
    message: "you have signedup successfully"
  });

});

app.post("/signin", async (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = await userModel.findOne({
    username: username,
    password: password
  });

  if(!userExists){
    res.status(401).json({
      message: "incorrect credentials"
    });
    return;
  }

  const token = jwt.sign({
    userId: userExists.id, 
  }, "sauravraman");

  res.json({
    token
  });
});

app.post("/organization", authMiddleware, async (req,res) => {
  const userId = req.userId;
  
  const newOrg = await organizationModel.create({
    title: req.body.title,
    description: req.body.description,
    admin: userId,
    members: []  
  });

  res.json({
    message: "Org. created",
    id: newOrg._id,
  });
});

app.post("/add-members-to-organization", authMiddleware, organizationAdminMiddleware, async (req, res) => {
  const memberUserUserName = req.body.memberUserUserName;
  const organization = req.organization;

  const memberUser = await userModel.findOne({ username: memberUserUserName });
  if (!memberUser) {
    res.status(404).json({ message: "User does not exist" });
    return;
  }

  await organization.updateOne({ $push: { members: memberUser._id } });
  res.json({ message: "Member added successfully" });
});

app.post("/board", authMiddleware, organizationAdminMiddleware, async (req, res) => {
  const organization = req.organization;

  const newBoard = await boardModel.create({
    title: req.body.title,
    organizationId: organization._id
  });

  res.json({ message: "Board created successfully", id: newBoard._id });
});

app.post("/issue", authMiddleware, boardOrganizationMemberOrAdminMiddleware, async (req, res) => {
  const board = req.board;         
  const status = req.body.status;

  const newIssue = await issueModel.create({
    title: req.body.title,
    boardId: board._id,
    status: status
  });

  res.json({ message: "Issue created successfully", id: newIssue._id });
});

//READ
app.get("/organization", authMiddleware, async (req,res) => {
  const userId = req.userId;
  const organizationId = req.query.organizationId;

  const organization = await organizationModel.findOne({
    _id: organizationId
  }).populate("members", "username");

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin.toString() !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  res.json({
    organization: organization
  });

});

app.get("/boards", authMiddleware, organizationMemberOrAdminMiddleware, async (req, res) => {
  const organization = req.organization;

  const orgBoards = await boardModel.find({
    organizationId: organization._id
  }).populate("organizationId", "title description");

  if (orgBoards.length === 0) {
    return res.status(404).json({ message: "No boards found" });
  }

  res.json({ boards: orgBoards });
});

app.get("/issues", authMiddleware, boardOrganizationMemberOrAdminMiddleware, async (req, res) => {
  const board = req.board;

  const boardIssues = await issueModel.find({
    boardId: board._id
  }).populate("boardId", "title");

  res.json({ issues: boardIssues });
});

app.get("/members", authMiddleware, organizationAdminMiddleware, async (req, res) => {
  const organization = await organizationModel.findOne({ _id: req.organization._id })
    .populate("members", "username")
    .populate("admin", "username");

  if (organization.members.length === 0) {
    return res.status(404).json({ message: "No members found" });
  }

  res.json({ members: organization.members });
});

//UPDATE
app.put("/issues", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const issueId = req.body.issueId;
  const newStatus = req.body.status;

  if (!issueId) return res.status(400).json({ message: "issueId is required" });
  if (!newStatus) return res.status(400).json({ message: "status is required" });

  const issue = await issueModel.findOne({ _id: issueId });
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  const board = await boardModel.findOne({ _id: issue.boardId });
  if (!board) return res.status(404).json({ message: "Board not found" });

  const organization = await organizationModel.findOne({ _id: board.organizationId });
  if (!organization) return res.status(404).json({ message: "Organization not found" });

  const isAdmin = organization.admin.toString() === userId;
  const isMember = organization.members.some(m => m.toString() === userId);

  if (!isAdmin && !isMember) {
    return res.status(403).json({ message: "You are not part of this organization" });
  }

  await issueModel.updateOne({ _id: issueId }, { status: newStatus });
  res.json({ message: "Issue status updated successfully" });
});


//DELETE
app.delete("/members", authMiddleware, organizationAdminMiddleware, async (req, res) => {
  const memberUserUserName = req.body.memberUserUserName;
  const organizationId = req.body.organizationId;

  const memberUser = await userModel.findOne({ username: memberUserUserName });
  if (!memberUser) {
    res.status(404).json({ message: "User does not exist" });
    return;
  }

  await organizationModel.updateOne(
    { _id: organizationId },
    { $pull: { members: memberUser._id } }
  );

  res.json({ message: "Member removed" });
});
 
app.listen(3000);