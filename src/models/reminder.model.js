// models/Reminder.js
import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  patient_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  rem_type: { 
    type: String, 
    enum: ["meal", "water", "medicine", "general"], 
    required: true 
  },

  status: { 
    type: String, 
    enum: ["pending", "acknowledged", "skipped"], 
    default: "pending" 
  },

  ack_status: { 
    type: String, 
    enum: ["yes", "no"], 
    default: "no" 
  },

  count_rem: { 
    type: Number, 
    default: 0, 
    max: 2 // send max 2 reminders
  },

  scheduled_time: { 
    type: Date, 
    required: true 
  },

  message: { 
    type: String, 
    default: "" 
  }
}, { timestamps: true });

// Useful compound index for querying reminders for a patient
reminderSchema.index({ patient_id: 1, rem_type: 1, scheduled_time: 1 });

export const Reminder = mongoose.model("Reminder", reminderSchema);
