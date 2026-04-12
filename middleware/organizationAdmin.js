const { organizationModel } = require("../models");

async function organizationAdminMiddleware(req, res, next) {
  const userId = req.userId;
  const organizationId = req.body?.organizationId || req.query.organizationId;

  const organization = await organizationModel.findOne({ _id: organizationId });

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin.toString() !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  req.organization = organization;
  next();
}

module.exports = { organizationAdminMiddleware };