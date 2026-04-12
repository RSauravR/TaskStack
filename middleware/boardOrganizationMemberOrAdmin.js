const { boardModel, organizationModel } = require("../models");

async function boardOrganizationMemberOrAdminMiddleware(req, res, next) {
  const userId = req.userId;
  const boardId = req.body?.boardId || req.query.boardId;

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

  req.board = board;
  req.organization = organization;
  next();
}

module.exports = { boardOrganizationMemberOrAdminMiddleware };