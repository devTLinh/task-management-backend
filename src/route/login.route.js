import express from 'express';
import controller from '../controllers/userController';

let router = express.Router();

router.post('/login', controller.postLogin);

router.post('/logout', controller.postLogOut);

router.post('/forgot-password', controller.postForgotPassword);

router.post('/verify-forgot-password', controller.postVerifyForgotPassword);

//router.post('/api/register', userController.postCreateMember);

module.exports = router;