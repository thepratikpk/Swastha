import { Patient } from "../models/patient.model.js";
import { User } from "../models/user.model.js"; // You need this import
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js"; // You need this import
import validator from "validator"; // You need this import

const generateRefreshAndAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something is wrong while generating tokens")
    }
}

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

const loginPatient = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }
    
    // Find the user using the base User model
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    
    if (!user.password) {
        throw new ApiError(400, "This account is not set up for password login. Please contact your doctor.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password.");
    }

    
    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(user._id);

   
    const loggedUser = await (user.role === 'patient'
        ? Patient.findById(user._id).select("-password -refreshToken")
        : Doctor.findById(user._id).select("-password -refreshToken"));

    if (!loggedUser) {
        throw new ApiError(500, "Something went wrong while logging in.");
    }

    
    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedUser, accessToken }, "User logged in successfully."));
});

const logoutPatient = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: "" } 
    }, { new: true });

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax"
    };

    // Clear the access and refresh token cookies from the client
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully."));
})
export { registerPatient ,loginPatient,logoutPatient};