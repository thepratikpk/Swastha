import { Patient } from "../models/patient.model.js";
import { User } from "../models/user.model.js"; // You need this import
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js"; // You need this import
import validator from "validator"; // You need this import

const registerPatient = asyncHandler(async (req, res) => {
    const { 
        name, 
        email, 
        password, 
        dob, 
        gender, 
        contact, 
        address,
        ayurvedic_category,
        mode,
        medical_history,
        diseases,
        allergies
    } = req.body;

    // The validation check is correct as long as all fields are provided in the request body.
    if (!name || !email || !password || !dob || !gender || !contact || !ayurvedic_category || !mode) {
        throw new ApiError(400, "All required patient fields must be provided.");
    }
    
    // Validate core fields
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

    // Corrected line: Use Model.create() directly without the 'new' keyword
    const newPatient = await Patient.create({
        name,
        email: email.toLowerCase(),
        password,
        dob,
        gender,
        contact,
        address,
        ayurvedic_category,
        mode,
        medical_history,
        diseases,
        allergies
    });

    // The created document is returned directly from Patient.create()
    const createdPatient = await Patient.findById(newPatient._id).select("-password");

    if (!createdPatient) {
        throw new ApiError(500, "Something went wrong while registering the patient.");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdPatient, "Patient registered successfully"));
});

export { registerPatient };