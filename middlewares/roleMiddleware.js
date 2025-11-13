// middleware/roleMiddleware.js
const restrictTo = (role) => {
  return (req, res, next) => {
    // req.user is populated by authMiddleware
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ 
        message: `Forbidden: Only ${role} access is allowed` 
      });
    }
  };
};

export const isTutor = restrictTo('tutor');
export const isStudent = restrictTo('student');