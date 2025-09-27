import { Doctor } from "../models/doctor.model.js";
import { User } from "../models/user.model.js";
import { Patient } from "../models/patient.model.js"; // Import Patient model
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnGCS } from "../utils/gcs.js"; // Assuming this utility exists

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

const registerDoctor = asyncHandler(async (req, res) => {
    const { 
        name, email, password, dob, gender, contact, address,
        licenseNo, hospital, specialty, phone, bio
    } = req.body;

    if (!name || !email || !password || !dob || !gender || !contact || !licenseNo || !hospital || !specialty) {
        throw new ApiError(400, "All required doctor fields must be provided");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Create new doctor
    const newDoctor = await Doctor.create({
        name,
        email: email.toLowerCase(),
        password,
        dob,
        gender,
        contact,
        address: address ? [address] : [],
        role: 'doctor',
        licenseNo,
        hospital,
        specialty,
        phone: phone || contact,
        bio: bio || ''
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newDoctor, "Doctor registered successfully"));
});

const loginDoctor = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }
    
    // Find the doctor directly
    const user = await Doctor.findOne({ email });
    if (!user) {
        throw new ApiError(404, "Doctor not found.");
    }

    if (!user.password) {
        throw new ApiError(400, "This account is not set up for password login.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password.");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(user._id);

    // Get the logged user without password and refresh token
    const loggedUser = await Doctor.findById(user._id).select("-password -refreshToken");

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
        .json(new ApiResponse(200, { user: loggedUser, accessToken }, "Doctor logged in successfully."));
});

const logoutDoctor = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: "" } 
    }, { new: true });

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Doctor logged out successfully."));
});

const addPatientToCurrentDoctor = asyncHandler(async (req, res) => {
  const {
    name, email, password, dob, gender, contact, address,
    ayurvedic_category, mode, diseases, allergies, height, weight
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !dob || !gender || !contact || !ayurvedic_category || !mode) {
    throw new ApiError(400, "All required patient fields must be provided");
  }

  // Get current doctor from JWT (set by verifyJWT middleware)
  const currentDoctor = req.user;
  
  if (!currentDoctor || currentDoctor.role !== 'doctor') {
    throw new ApiError(403, "Only doctors can add patients to their practice");
  }

  // Check if user with this email already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // ✅ Parse address JSON string into array
  let parsedAddress = [];
  if (address) {
    try {
      parsedAddress = JSON.parse(address);
      if (!Array.isArray(parsedAddress)) throw new Error();
    } catch (err) {
      throw new ApiError(400, "Address must be a valid JSON array of objects");
    }
  }

  // ✅ Upload medical documents to GCS
  const uploadedDocs = Object.values(req.files || {}).flatMap(fileArr =>
    fileArr.map(file => file.path)
  );

  const medical_history = await Promise.all(
    uploadedDocs.map(async (localFilePath) => {
      const gcsRes = await uploadOnGCS(localFilePath, "PatientDocuments");
      return gcsRes?.secure_url || null;
    })
  );

  const filteredMedicalHistory = medical_history.filter(Boolean);

  // ✅ Parse and validate arrays for Mongoose schema
  const parsedDiseases = diseases ? 
    (typeof diseases === 'string' ? JSON.parse(diseases) : diseases) : [];
  const parsedAllergies = allergies ? 
    (typeof allergies === 'string' ? JSON.parse(allergies) : allergies) : [];

  // ✅ Create new patient assigned to current doctor
  const newPatient = await Patient.create({
    name,
    email: email.toLowerCase(),
    password,
    dob,
    gender,
    contact,
    address: parsedAddress,
    role: 'patient', // Explicitly set the role
    ayurvedic_category,
    mode,
    diseases: Array.isArray(parsedDiseases) ? parsedDiseases : 
              parsedDiseases.split(",").map(d => d.trim()),
    allergies: Array.isArray(parsedAllergies) ? parsedAllergies : 
               parsedAllergies.split(",").map(a => a.trim()),
    medical_history: filteredMedicalHistory,
    height: height ? parseFloat(height) : null,
    weight: weight ? parseFloat(weight) : null,
    assigned_doctor: currentDoctor._id // Automatically assign to current doctor
  });

  // Remove password from response and populate doctor info
  const patientResponse = await Patient.findById(newPatient._id)
    .select('-password -refreshToken')
    .populate('assigned_doctor', 'name email');

  return res
    .status(201)
    .json(new ApiResponse(201, patientResponse, `Patient registered and assigned to you successfully`));
});

/**
 * @description Controller to fetch all patients assigned to the currently logged-in doctor.
 */
const getAssignedPatients = asyncHandler(async (req, res) => {
  // The verifyJWT middleware ensures req.user is populated and the user is logged in.
  const currentDoctorId = req.user._id;

  // 1. Authorization check: Ensure the user is a doctor
  if (req.user.role !== 'doctor') {
    throw new ApiError(403, "Access denied. Only doctors can view assigned patients.");
  }

  // 2. Query the Patient model
  const patients = await Patient.find({
    assigned_doctor: currentDoctorId
  })
  .select("-password -refreshToken") // Exclude sensitive fields
  .populate('assigned_doctor', 'name email contact'); // Optionally populate doctor info for completeness

  if (!patients) {
    // This is unlikely, but good practice to check if the query failed
    throw new ApiError(500, "Could not fetch patients.");
  }

  // 3. Send the response
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      patients,
      `Successfully fetched ${patients.length} assigned patients.`
    ));
});


export { 
  registerDoctor, 
  loginDoctor, 
  logoutDoctor, 
  addPatientToCurrentDoctor,
  getAssignedPatients // Export the new controller function
};
