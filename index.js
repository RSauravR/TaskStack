const express = require("express");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("./middleware/auth");
const {organizationAdminMiddleware} = require('./middleware/organizationAdmin');
const {boardMemberOrAdmin} = require("./middleware/boardMemberOrAdmin");
const { users, organizations, boards, issues } = require("./db");
const {userModel, organizationModel} = require("./models");

let users_id = 1;
let organization_id = 1;
let board_id = 1;
let issues_id = 1;

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

app.post("/add-members-to-organization", authMiddleware, async (req,res) => {
  const userId = req.userId;
  const organizationId = req.body.organizationId;
  const memberUserUserName = req.body.memberUserUserName;

  const organization = await organizationModel.findOne({
    _id: organizationId
  });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin.toString() !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  const memberUser = await userModel.findOne({
    username: memberUserUserName
  });

  if(!memberUser){
    res.status(404).json({ message: "User does not exist"})
    return;
  }

  await organization.updateOne({
    $push: {
      "members": memberUser._id
    }
  });
  res.json({ message: "Member added successfully" });

});

app.post("/board", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;

  boards.push({
    id: board_id++,
    title: req.body.title,
    organizationId: organization.id
  });
  res.json({ 
    message: "Board created successfully",
    id: board_id - 1 
  });
});

app.post("/issue", authMiddleware, boardMemberOrAdmin, (req,res) => {
  const boardId = req.body.boardId;
  if (!boardId) {
    res.status(400).json({ message: "valid boardId is required" });
    return;
  }

  issues.push({ 
    id: issues_id++,
    title: req.body.title,
    boardId: boardId,
    status: req.body.status
  });
  res.json({
    message: "issue created successfully",
    id: issues_id - 1
  });
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

app.get("/boards", authMiddleware, boardMemberOrAdmin, (req,res) => {
  const organization = req.organization;
  const orgBoards = boards.filter(board => board.organizationId === organization.id);
  if(orgBoards.length  === 0){
    return res.status(404).json({ message: "Board not found" });
  }
  res.json({
    boards: orgBoards
  });
});

app.get("/issues", authMiddleware, boardMemberOrAdmin, (req,res) => {
  const boardId = parseInt(req.query.boardId);
  if (!boardId) {
    res.status(400).json({ message: " valid boardId is required" });
    return;
  }

  const boardIssues = issues.filter(issue => issue.boardId === boardId);
  res.json({
    issues: boardIssues
  });
});

app.get("/members", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;

  const enrichedMembers = organization.members.map(memberId => {
    const user = users.find(u => u.id === memberId);
    return { id: user.id, username: user.username };
  });

  if (enrichedMembers.length === 0) {
    return res.status(404).json({ message: "No members found in this organization" });
  }

  res.json({ members: enrichedMembers });
});

//UPDATE
app.put("/issues", authMiddleware, boardMemberOrAdmin, (req,res) => {
  const issueId = parseInt(req.body.issueId);
  const newStatus = req.body.status;

  if (isNaN(issueId)) {
    return res.status(400).json({ message: "Valid issueId is required" });
  }

  if (!newStatus) {
    return res.status(400).json({ message: "New status is required" });
  }

  const issue = issues.find(i => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  issue.status = newStatus;

  res.json({
    message: "Issue status updated successfully",
    issue
  });
});


//DELETE
app.delete("/members", authMiddleware, async (req,res) => {
  const userId = req.userId;
  const organizationId = req.body.organizationId;
  const memberUserUserName = req.body.memberUserUserName;

  const organization = await organizationModel.findOne({
    _id: organizationId
  });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin.toString() !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  const memberUser = await userModel.findOne({
    username: memberUserUserName
  });

  if(!memberUser){
    res.status(404).json({ message: "User does not exist"})
    return
  }

  await organizationModel.updateOne({ 
    _id: organizationId 
    },{ 
      $pull: { 
        members: memberUser._id 
      } 
  })

  // organization.members = organization.members.filter(x => x.toString() !== memberUser._id.toString());
  // await organization.save();
  
  res.json({
    message: "member removed"
  });
});
 
app.listen(3000);