const { users, organizations, boards, issues } = require("../db");


function boardMemberOrAdmin(req, res, next) {
  const userId = req.userId; // comes from authMiddleware

  // Support both POST/PUT (body) and GET (query)
  const organizationId = parseInt(req.query.organizationId || req.body?.organizationId);

  const organization = organizations.find(org => org.id === organizationId);

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin !== userId && !organization.members.includes(userId)) {
    res.status(403).json({ message: "You are not part of the organization" });
    return;
  }

  // Attach the organization object to req for downstream use
  req.organization = organization;
  next();
}

module.exports = {
  boardMemberOrAdmin: boardMemberOrAdmin
};