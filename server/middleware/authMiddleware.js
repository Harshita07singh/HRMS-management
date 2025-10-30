// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer "))
//     return res.status(401).json({ message: "No token provided" });

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });
//     req.user = user;
//     next();
//   } catch {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Decode token first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user to ensure they still exist
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Merge JWT fields + DB user fields into req.user
    req.user = {
      ...decoded, // includes id, role, employeeId, etc.
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
