import MessageRepository from "../repositories/MessageRepository";
import UserRepository from "../repositories/UserRepository";
import { mkdirSync, renameSync } from "fs";

export class MessageService {
  async getMessages(user1: string, user2: string) {
    return await MessageRepository.getMessagesBetweenUsers(user1, user2);
  }

  async uploadFile(file: Express.Multer.File) {
    const date = Date.now();
    const fileDir = `uploads/files/${date}`;
    const fileName = `${fileDir}/${file.originalname}`;

    mkdirSync(fileDir, { recursive: true });
    renameSync(file.path, fileName);

    return fileName;
  }
}

export class ContactsService {
  async searchContacts(userId: string, searchTerm: string) {
    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizedSearchTerm, "i");
    return await UserRepository.searchContacts(userId, regex);
  }

  async getContactsForDMList(userId: string) {
    return await MessageRepository.getContactsForDMList(userId);
  }

  async getAllContacts(userId: string) {
    const users = await UserRepository.getAllContacts(userId);
    return users.map(user => ({
      label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      value: user._id,
    }));
  }
}

export const messageService = new MessageService();
export const contactsService = new ContactsService();
