import mongoose from 'mongoose';
import { User } from './user.model.js';

const doctorSchema = new mongoose.Schema({
    specialization: {
        type: [String],
        required: true
    },
    experience: Number,
    verification_status: {
        type: Boolean,
        default: false
    },
    patients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    }]
});

// Create the Doctor model using the discriminator() method
export const Doctor = User.discriminator('doctor', doctorSchema);