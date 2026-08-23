import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const wipeDatabase = async () => {
  try {
    const url = process.env.DATABASE_URL || "mongodb+srv://shivanshkaushik1237:jebn3B0cBlg3ep9t@syncronus-chat-app.ndoj5.mongodb.net/?retryWrites=true&w=majority&appName=syncronus-chat-app";
    await mongoose.connect(url);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }

    console.log("Database wiped successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error wiping database:", error);
    process.exit(1);
  }
};

wipeDatabase();
