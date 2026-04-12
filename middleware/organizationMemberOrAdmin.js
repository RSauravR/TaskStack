const { organizationModel } = require("../models");

async function organizationMemberOrAdminMiddleware(req, res, next) {
  const userId = req.userId;
  const organizationId = req.body?.organizationId || req.query.organizationId;

  const organization = await organizationModel.findOne({ _id: organizationId });

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

  req.organization = organization;
  next();
}

module.exports = { organizationMemberOrAdminMiddleware };