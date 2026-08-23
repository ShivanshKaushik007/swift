import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware";
import { globalSearch } from "../controllers/SearchController";

const searchRoutes = Router();

searchRoutes.get("/", verifyToken, globalSearch);

export default searchRoutes;
