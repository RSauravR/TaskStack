const express = require("express");
const jwt = require("jsonwebtoken");
const {authMiddleware} = require("./middleware/auth");
const {organizationAdminMiddleware} = require('./middleware/organizationAdmin');

let users_id = 1;
let organization_id = 1;
let board_id = 1;
let issues_id = 1;

const users = [];

const organizations = [];

const boards = [{
    id: 1,
    title: "100xschool website (frontend)",
    organizationId: 1
}];

const issues = [{
    id: 1,
    title: "Add dark mode",
    boardId: 1,
    status: "IN_PROGRESS"
  }, {
    id: 2,
    title: "Allow admins to create more courses",
    boardId: 1,
    status: "DONE",
}];

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
  const memberId = req.body.memberId;

  const memberUser = users.find(u => u.id === memberId);
  if (!memberUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!organization.members.includes(memberUser.id)) {
    organization.members.push(memberUser.id); 
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
  res.json({ message: "Board created successfully" });
});

app.post("/issue", (req,res) => {

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

app.get("/boards", (req,res) => {

});

app.get("/issues", (req,res) => {

});

app.get("/members", (req,res) => {

});

//UPDATE
app.put("/issues", (req,res) => {

});

//DELETE
app.delete("/members", authMiddleware, organizationAdminMiddleware, (req,res) => {
  const organization = req.organization;
  const memberId = req.body.memberId;

  organization.members = organization.members.filter(id => id !== memberId);
  
  res.json({
    message: "member removed"
  });
});

app.listen(3000);