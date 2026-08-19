import express from 'express';

import {
    signup,
    signin,
    getUser,
    refresh,
    logout,
    changePassword,
    resetpassword,
    updateForgottenPassword,
} from '../controllers/authController.js';

import authenticateUser from '../middleware/authMiddleware.js';

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================

router.post('/signup', signup);

router.post('/signin', signin);

router.post('/refresh', refresh);

router.post('/resetpassword', resetpassword);

router.post(
    '/update-forgotten-password',
    updateForgottenPassword
);

// =========================================================
// PROTECTED ROUTES
// =========================================================

router.get(
    '/user',
    authenticateUser,
    getUser
);

router.post(
    '/logout',
    authenticateUser,
    logout
);

router.post(
    '/changePassword',
    authenticateUser,
    changePassword
);

export default router;