import mongoose, { Schema } from 'mongoose';

const addressSchema = new mongoose.Schema({
    city: String,
    state: String,
    country: String,
    isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    dob: Date,
    gender: {
        type: String,
        enum: ["male", "female", "prefer not to say"]
    },
    contact: String,
   
    address: [addressSchema], 
    role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor']
    }
}, {
    timestamps: true,
    discriminatorKey: 'role'
});

export const User = mongoose.model('User', userSchema);