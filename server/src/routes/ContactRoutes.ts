import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware";
import { getAllContacts, getContactsForDMList, searchContacts } from "../controllers/ContactsController";

const contactsRoutes = Router();

contactsRoutes.post("/search", verifyToken, searchContacts);
contactsRoutes.get("/get-contacts-for-dm", verifyToken, getContactsForDMList);
contactsRoutes.get("/get-all-contacts", verifyToken, getAllContacts);
export default contactsRoutes;