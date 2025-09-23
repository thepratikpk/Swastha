import { Router } from 'express';
import { registerPatient } from '../controllers/patient.controller.js';
import { upload } from '../middlewares/multer.middleware.js'; // Import the upload middleware
import { loginPatient, logoutPatient, registerPatient } from '../controllers/patient.controller.js'
import { verifyJWT } from '../middlewares/auth.middlewares.js'

const router = Router();

router.route('/register-patient').post(
    upload.fields([
        { name: 'medicalDoc', maxCount: 1 } // The 'name' must match the field name in your frontend form
    ]),
    registerPatient
);

router.route('/login-patient').post(loginPatient)

router.use(verifyJWT)
router.route('/logout-patient').post(logoutPatient)

export default router;