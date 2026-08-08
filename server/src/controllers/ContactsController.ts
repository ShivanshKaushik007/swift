import { Request, Response, NextFunction } from "express";
import { contactsService } from "../services/MessageService";

export const searchContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { searchTerm } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(400).send("User ID missing");
    if (searchTerm === undefined || searchTerm === null) {
      return res.status(400).send("searchTerm is required.");
    }

    const contacts = await contactsService.searchContacts(userId, searchTerm);
    return res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};

export const getContactsForDMList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    const contacts = await contactsService.getContactsForDMList(userId);
    return res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};

export const getAllContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    const contacts = await contactsService.getAllContacts(userId);
    return res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};
