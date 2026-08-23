import { Router } from "express";
import { verifyToken, verifySuperAdmin } from "../middleware/AuthMiddleware";
import { getAnalytics } from "../controllers/AdminController";

const adminRoutes = Router();

adminRoutes.get("/analytics", verifyToken, verifySuperAdmin, getAnalytics);

export default adminRoutes;
