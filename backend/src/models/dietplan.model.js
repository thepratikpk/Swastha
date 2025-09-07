import mongoose from "mongoose";

//foodItem
const foodItemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    category: String,
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    fiber: Number,
    ayurvedic_properties: {
        rasa: String,   // Madhura, Amla...
        virya: String,  // Ushna / Shita
        guna: [String],
        vipaka: String
    },
    tags: [String]
});

foodItemSchema.index({ name: "text", "ayurvedic_properties.rasa": 1, calories: 1 });

const dayPlanSchema = new mongoose.Schema({
    day: Number,
    date: Date,              // 1,2,3...
    meals: [
        {
            type: {
                type: String,
                enum: ["breakfast", "lunch", "dinner", "snack"]
            }, // "breakfast","lunch","dinner","snack"
            items: [foodItemSchema]
        }
    ],

});

const dietPlanSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // doctor
    plan: [dayPlanSchema],
    totalCaloriesPerDay: Number,
    waterIntakePerDay: Number

}, { timestamps: true });

dietPlanSchema.index({ patient: 1, createdBy: 1 });
export default DietPlan = mongoose.model("DietPlan", dietPlanSchema)