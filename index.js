const express = require("express");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("./middleware/auth");
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

app.post("/board", authMiddleware, async (req,res) => {
  const userId = req.userId;
  const organizationId = req.body.organizationId;

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

  const newBoard = await boardModel.create({
    title: req.body.title,
    organizationId: organizationId 
  });

  res.json({
    message: "Board created successfully",
    id: newBoard._id
  })
});

app.post("/issue", authMiddleware, async (req,res) => {
  const userId = req.userId;
  const boardId = req.body.boardId;
  const status = req.body.status;
  const organizationId = req.body.organizationId;

  const board = await boardModel.findOne({
    _id: boardId
  });

  if (!board) {
    res.status(404).json({ message: "board doesn't exist" });
    return;
  }

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

  const newIssue = await issueModel.create({
    title: req.body.title,
    boardId: boardId,
    status: status
  });

  res.json({
    message: "issue created successfully",
    id: newIssue._id
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

app.get("/boards", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const organizationId = req.query.organizationId;

  const organization = await organizationModel.findOne({
    _id: organizationId
  });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  const isAdmin = organization.admin.toString() === userId;
  const isMember = organization.members.some(
    memberId => memberId.toString() === userId
  );

  if (!isAdmin && !isMember) {
    res.status(403).json({ message: "You are not part of this organization" });
    return;
  }

  const orgBoards = await boardModel.find({
    organizationId: organizationId
  }).populate("organizationId", "title description");

  if (orgBoards.length === 0) {
    return res.status(404).json({ message: "No boards found" });
  }

  res.json({ boards: orgBoards });
});

app.get("/issues", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const boardId = req.query.boardId;

  const board = await boardModel.findOne({ _id: boardId });

  if (!board) {
    res.status(404).json({ message: "Board doesn't exist" });
    return;
  }

  const organization = await organizationModel.findOne({
    _id: board.organizationId
  });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  const isAdmin = organization.admin.toString() === userId;
  const isMember = organization.members.some(
    memberId => memberId.toString() === userId
  );

  if (!isAdmin && !isMember) {
    res.status(403).json({ message: "You are not part of this organization" });
    return;
  }

  const boardIssues = await issueModel.find({
    boardId: boardId
  }).populate("boardId", "title");

  res.json({ issues: boardIssues });
});

app.get("/members", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const organizationId = req.query.organizationId;

  const organization = await organizationModel.findOne({
    _id: organizationId
  })
  .populate("members", "username")
  .populate("admin", "username");

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin._id.toString() !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  if (organization.members.length === 0) {
    return res.status(404).json({ message: "No members found in this organization" });
  }

  res.json({ members: organization.members });
});

//UPDATE
app.put("/issues", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const issueId = req.body.issueId;
  const newStatus = req.body.status;

  if (!issueId) {
    return res.status(400).json({ message: "Valid issueId is required" });
  }

  if (!newStatus) {
    return res.status(400).json({ message: "New status is required" });
  }

  const issue = await issueModel.findOne({ _id: issueId });

  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  const board = await boardModel.findOne({ _id: issue.boardId });

  if (!board) {
    res.status(404).json({ message: "Board doesn't exist" });
    return;
  }

  const organization = await organizationModel.findOne({
    _id: board.organizationId
  });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  const isAdmin = organization.admin.toString() === userId;
  const isMember = organization.members.some(
    memberId => memberId.toString() === userId
  );

  if (!isAdmin && !isMember) {
    res.status(403).json({ message: "You are not part of this organization" });
    return;
  }

  await issueModel.updateOne(
    { _id: issueId },
    { status: newStatus }
  );

  res.json({ message: "Issue status updated successfully" });
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