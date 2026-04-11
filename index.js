const express = require("express");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("./middleware/auth");
const {organizationAdminMiddleware} = require('./middleware/organizationAdmin');
const {boardMemberOrAdmin} = require("./middleware/boardMemberOrAdmin");
const { users, organizations, boards, issues } = require("./db");

let users_id = 1;
let organization_id = 1;
let board_id = 1;
let issues_id = 1;

const app = express();
app.use(express.json());

//CREATE
app.post("/signup", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = users.find( (user) => user.username === username);
  if(userExists){
    res.status(409).json({
      message: "user with this user name exist"
    });
    return;
  }

  users.push({
    username: username,
    password: password,
    id: users_id++,
  });

  res.json({
    message: "you have signedup successfully"
  });

});

app.post("/signin", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  const userExists = users.find(user => user.username === username && user.password === password);
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

app.post("/organization", authMiddleware, (req,res) => {
  const userId = req.userId;
  organizations.push({
    id: organization_id++,
    title: req.body.title,
    description: req.body.description,
    admin: userId,
    members: []
  });
  res.json({
    message: "Org. created",
    id: organization_id - 1,
  });
});

app.post("/add-members-to-organization", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;
  const memberUserName = req.body.memberUserName;

  const userExists = users.find(u => u.username === memberUserName);
  if (!userExists) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!organization.members.includes(userExists.id)) {
    organization.members.push(userExists.id); 
  }

  res.json({
    message: "New memeber added"
  });

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
app.get("/organization", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;

  res.json({
    organization: {
      ...organization,
      members: organization.members.map(memberId => {
        const user = users.find(user => user.id === memberId);
        return {
          id: user.id,
          username: user.username
        }
      })
    }
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
app.delete("/members", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;
  const memberId = parseInt(req.body.memberId);

  organization.members = organization.members.filter(id => id !== memberId);
  
  res.json({
    message: "member removed"
  });
});
 
app.listen(3000);