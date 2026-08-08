import cron from "node-cron";
import Message from "../models/MessagesModel";

export const startScheduledMessagesJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Find messages scheduled to be sent now or earlier, but still have 'scheduled' status
      const scheduledMessages = await Message.find({
        status: "scheduled",
        scheduledAt: { $lte: now },
        deletedAt: { $exists: false },
      });

      if (scheduledMessages.length > 0) {
        console.log(`Sending ${scheduledMessages.length} scheduled messages...`);
        for (const message of scheduledMessages) {
          message.status = "sent";
          message.timestamp = new Date(); // Update timestamp to actual send time
          await message.save();

          // We also need to emit this via Socket.IO so it appears in real-time
          // However, since we don't have direct access to the io instance here easily without refactoring,
          // it's best handled if the job is initialized with the io instance or via a pub/sub.
          // For now, we will just rely on the clients re-fetching or we will add an event emitter.
          // (We will emit an event that socket.ts can listen to)
          const { getIo } = require("../socket");
          const io = getIo();
          if (io) {
            // Emitting to recipient or channel
            if (message.recipient) {
              // Send to sender's room and recipient's room
              io.to(message.sender.toString()).to(message.recipient.toString()).emit("receiveMessage", message);
            } else if (message.channelId) {
              io.to(message.channelId.toString()).emit("receiveMessage", message);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error running scheduled messages job:", error);
    }
  });
};
