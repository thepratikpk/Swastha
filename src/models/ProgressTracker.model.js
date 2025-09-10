// models/ProgressTracker.js  // meal-level logs + water logs per date
import mongoose from "mongoose";

const mealLogSchema = new mongoose.Schema({

  item: { type: String }, // fallback if recipe not linked
  status: { 
    type: String, 
    enum: ["pending", "completed", "skipped"], 
    default: "pending" 
  },
  time: Date,
  updated_at: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ["breakfast", "lunch", "dinner", "snack"], 
    required: true 
  }
});


const waterLogSchema = new mongoose.Schema({
  current_intake_quantity: { type: Number, default: 0 }, // ml
  recommended_intake: { type: Number, required: true }, // ml
  updated_at: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["low", "on-track", "completed"], 
    default: "low" 
  }
});


const progressTrackerSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // start-of-day
  meal_log: [mealLogSchema],
  water_intake_logs: [waterLogSchema],
  streakIncremented: { type: Boolean, default: false }, // indicates if streak counted for that date
  // optionally point to which reminder triggered this date
  reminder_id: { type: mongoose.Schema.Types.ObjectId, ref: "Reminder" }
}, { timestamps: true });

progressTrackerSchema.index({ patient: 1, date: 1 }, { unique: true });
export const ProgressTracker = mongoose.model("ProgressTracker", progressTrackerSchema);
