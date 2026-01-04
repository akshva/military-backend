export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireBaseScope(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  
  const baseId = parseInt(req.body?.base_id || req.query?.base_id || req.params?.baseId);
  if (!baseId || baseId !== req.user.base_id) {
    return res.status(403).json({ error: 'Access restricted to your base' });
  }
  next();
}
