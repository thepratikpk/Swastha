import { Router } from 'express';
import { 
  addPatientToCurrentDoctor, 
  loginDoctor, 
  logoutDoctor, 
  registerDoctor, 
  getAssignedPatients // Import the new controller
} from '../controllers/doctor.controller.js'
import { authorizeRoles, verifyJWT } from '../middlewares/auth.middlewares.js'
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/register-doctor", registerDoctor);
router.route('/login-doctor').post(loginDoctor);

// Protected routes (require verifyJWT)
router.use(verifyJWT);

router.route('/logout-doctor').post(logoutDoctor);

// Route to add a new patient and automatically assign them to the current doctor
router.route("/add-patient").post(
  upload.fields([
    { name: "medical_history", maxCount: 5 }
  ]),
  authorizeRoles("doctor"), 
  addPatientToCurrentDoctor
);

// New route to fetch all patients assigned to the current doctor
router.route("/patients").get(
  authorizeRoles("doctor"), 
  getAssignedPatients
);

export default router;
