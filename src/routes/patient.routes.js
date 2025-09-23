import { Router } from 'express';
import { registerPatient } from '../controllers/patient.controller.js';
import { upload } from '../middlewares/multer.middleware.js'; // Import the upload middleware

const router = Router();

router.route('/register-patient').post(
    upload.fields([
        { name: 'medicalDoc', maxCount: 1 } // The 'name' must match the field name in your frontend form
    ]),
    registerPatient
);

export default router;