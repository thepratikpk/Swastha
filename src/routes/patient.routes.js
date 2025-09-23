import {Router} from 'express'
import { loginPatient, logoutPatient, registerPatient } from '../controllers/patient.controller.js'
import { verifyJWT } from '../middlewares/auth.middlewares.js'

const router=Router()

router.route('/register-patient').post(registerPatient)
router.route('/login-patient').post(loginPatient)

router.use(verifyJWT)
router.route('/logout-patient').post(logoutPatient)

export default router