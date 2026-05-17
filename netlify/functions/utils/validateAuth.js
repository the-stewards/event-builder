import jwt from "jsonwebtoken";

export function validateAuth(headers) {
  const auth = headers.authorization || headers.Authorization || "";
  const token = auth.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
}
