import mongoose, { Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  workspaceId: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  action: string;
  target?: mongoose.Types.ObjectId;
  details?: any;
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspaces",
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>("AuditLogs", auditLogSchema);
export default AuditLog;
