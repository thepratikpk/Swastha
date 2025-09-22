import mongoose from 'mongoose';
import { User } from './user.model.js';


const patientSchema = new mongoose.Schema({
    ayurvedic_category: {
        type: String,
        required:true,
        enum: ["vata", "pitta", "kapha"]
    },
    medical_history: [String],
    diseases: [String],
    assigned_doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    },
    mode:{
        type:String,
        required:true,
        enum:["online","offline"]
    },
    allergies: [String]
});

// Create the Patient model by using the discriminator() method on the base User model
export const Patient = User.discriminator('patient', patientSchema);