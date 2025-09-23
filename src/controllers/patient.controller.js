import { Patient } from "../models/patient.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator";

const registerPatient = asyncHandler(async (req, res) => {
    // ⚠️ Note: req.body will contain non-file fields as strings from FormData.
    const { 
        name, 
        email, 
        password, 
        dob, 
        gender, 
        contact, 
        address, // This will be a JSON string from the frontend
        ayurvedic_category,
        mode,
        medical_history,
        allergies
    } = req.body;

    // 1. Handle the JSON string for the 'address' field
    let parsedAddress = {};
    if (address) {
        try {
            parsedAddress = JSON.parse(address);
        } catch (error) {
            throw new ApiError(400, "Invalid address format.");
        }
    }
    
    // 2. Access the uploaded file from req.files (due to Multer configuration)
    const medicalDocFile = req.files?.medicalDoc?.[0];
    const medicalDocPath = medicalDocFile ? medicalDocFile.path : null;

    // 3. Perform validation checks
    if (!name || !email || !password || !dob || !gender || !contact || !ayurvedic_category || !mode) {
        throw new ApiError(400, "All required patient fields must be provided.");
    }
    
    if (!validator.isEmail(email)) {
        throw new ApiError(400, "Invalid email format.");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long.");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists.");
    }

    // 4. Parse comma-separated strings into arrays
    const parsedAllergies = allergies ? allergies.split(',').map(s => s.trim()) : [];
    const parsedMedicalHistory = medical_history ? medical_history.split(',').map(s => s.trim()) : [];

    // 5. Create the new patient entry
    const newPatient = await Patient.create({
        name,
        email: email.toLowerCase(),
        password,
        dob,
        gender,
        contact,
        address: parsedAddress, // Use the parsed object
        ayurvedic_category,
        mode,
        medical_history: parsedMedicalHistory,
        allergies: parsedAllergies,
        medicalDoc: medicalDocPath, // Store the path to the uploaded file
    });

    const createdPatient = await Patient.findById(newPatient._id).select("-password");

    if (!createdPatient) {
        throw new ApiError(500, "Something went wrong while registering the patient.");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdPatient, "Patient registered successfully"));
});

export { registerPatient };