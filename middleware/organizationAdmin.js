function organizationAdminMiddleware(req, res, next) {
  const userId = req.userId; // comes from authMiddleware

  // Support both POST/PUT (body) and GET (query)
  const organizationId = parseInt(req.body.organizationId || req.query.organizationId);

  const organization = organizations.find(org => org.id === organizationId);

  if (!organization) {
    res.status(404).json({ message: "Organization doesn't exist" });
    return;
  }

  if (organization.admin !== userId) {
    res.status(403).json({ message: "You are not the admin of this organization" });
    return;
  }

  // Attach the organization object to req for downstream use
  req.organization = organization;
  next();
}

module.exports = {
  organizationAdminMiddleware: organizationAdminMiddleware
};