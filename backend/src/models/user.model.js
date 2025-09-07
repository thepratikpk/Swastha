import mongoose, { model } from "mongoose";

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: {
        type: String,
        match: [/^\d{6}$/, "Invalid pincode"]
    },
    isDefault: { type: Boolean, default: false }
})

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "prefer not to say"]
    },
    contact: {
        type: String,
        required:true

    },
    address:[addressSchema],
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["doctor", "patient"],
        required: true
    },

    // Patient specific
    ayurvedic_category: {
        type: String,
        enum: ["vata", "pitta", 'kapha']
    },
    medical_history: [String],
    diseases: [String],               // ["Diabetes","Hypertension", ...]
    assigned_doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    allergies: {
        type: [String],
    },


    // doctor Specific

    specialization: {
        type: [String],
        required: true
    },
    experience: Number,
    verification_status: { type: Boolean, default: false },
    patients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
}, {
    timestamps: true
})

export default User = mongoose.model("User", userSchema)