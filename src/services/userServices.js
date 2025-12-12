import db from '../models/index.js';
import _ from 'lodash';
import emailServices from './emailServices.js';
import {
   checkIsValidInput
} from '../helpers/checkIsValidInput.js';
import {
    hashValue
} from '../helpers/hashValue.js';
import {
   randomDigitString
} from '../helpers/randomDigitString.js';
import {
   Op
} from 'sequelize';
import {
   randomString
} from '../helpers/randomString.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


let postCreateUser = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (_.isEmpty(data)) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing data'
            })
         } else {
            let check = checkIsValidInput(data, ['userName', 'email', 'password', 'fullName', 'role']);
            // let check = checkIsValidInput(data, ['userName', 'email', 'password', 'fullName']);
            if (!check.isValid) {
               resolve({
                  errorCode: 2,
                  errorMessage: `Missing parameter: ${check.element}`
               })
            } else {
               let emailExist = await db.User.findOne({
                  where: {
                     email: data.email
                  }
               });

               if (emailExist) {
                  resolve({
                     errorCode: 2,
                     errorMessage: `Email already exists`
                  })
               } else {
                  // Hash password
                  let hashedPassword = await hashValue(data.password);
                  // Create user
                  let newUser = await db.User.create({
                     UserName: data.userName,
                     Email: data.email,
                     PasswordHash: hashedPassword,
                     FullName: data.fullName,
                     Role: data.role
                  });

                  resolve({
                     errorCode: 0,
                     errorMessage: `Create user successfully`,
                     user: newUser
                  })
               }
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let putEditUser = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         let check = checkIsValidInput(data, ['userName', 'email', 'fullName', 'role']);
         if (_.isEmpty(data) || !check.isValid) {
            resolve({
               errorCode: 1,
               errorMessage: `Missing parameter: ${check.element}`
            })
         } else {
            // Check if user exists
            let user = await db.User.findOne({
               where: {
                  email: data.email
               }
            });

            if (!user) {
               resolve({
                  errorCode: 2,
                  errorMessage: `User not found`
               })
            } else {
               // Update user
               // let hashedPassword = await hashValue(data.password);
               let hashedPassword = '';
               if(data.password) {
                  hashedPassword = await hashValue(data.password);
               } else {
                  hashedPassword = user.PasswordHash;
               }

               await db.User.update({
                  userName: data.userName,
                  email: data.email,
                  fullName: data.fullName,
                  PasswordHash: hashedPassword,
                  role: data.role
               }, {
                  where: {
                     id: user.id
                  }
               });

               resolve({
                  errorCode: 0,
                  errorMessage: `Update user successfully`,
               })
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let getAllUsers = () => {
   return new Promise(async (resolve, reject) => {
      try {
         let users = await db.User.findAll({
            attributes: {
               exclude: ['password']
            }
         });
         resolve({
            errorCode: 0,
            errorMessage: 'Get all users successfully',
            users: users
         });
      } catch (error) {
         reject(error);
      }
   })
}

let getUserById = (id) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (!id) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing parameter: id'
            });
         } else {
            let user = await db.User.findOne({
               where: {
                  id: id
               },
               attributes: {
                  exclude: ['password']
               }
            });

            if (!user) {
               resolve({
                  errorCode: 2,
                  errorMessage: 'User not found'
               });
            } else {
               resolve({
                  errorCode: 0,
                  errorMessage: 'Get user by id successfully',
                  user: user
               });
            }
         }
      } catch (error) {
         reject(error)
      }
   })
}

let deleteUser = (id) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (!id) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing parameter: id'
            })
         } else {
            let user = await db.User.findOne({
               where: {
                  id: id
               }
            })

            if (!user) {
               resolve({
                  errorCode: 2,
                  errorMessage: 'User not found'
               })
            } else {
               await db.User.destroy({
                  where: {
                     id: id
                  }
               })
               resolve({
                  errorCode: 0,
                  errorMessage: 'Delete user successfully'
               })
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let postLogin = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         // let check = checkIsValidInput(data, ['email', 'password']);

         if (_.isEmpty(data)) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing data'
            })
         } else {
            let check = checkIsValidInput(data, ['email', 'password']);
            if (!check.isValid) {
               resolve({
                  errorCode: 2,
                  errorMessage: `Missing parameter: ${check.element}`
               })
            } else {
               let user = await db.User.findOne({
                  where: {
                     email: data.email
                  },
                  raw: true
               })
               if (!user) {
                  resolve({
                     errorCode: 3,
                     errorMessage: 'User not found or email not exist !'
                  })
               } else {
                   let checkPassword = bcrypt.compareSync(data.password, user.PasswordHash);
                  if (!checkPassword) {
                     resolve({
                        errorCode: 4,
                        errorMessage: 'Wrong password!'
                     })
                  } else {
                     delete user.PasswordHash;
                     user.token = randomString(20);
                     const payload = {
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role
                     }
                     const access_token = jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        {
                           expiresIn: process.env.JWT_EXPIRE
                        }
                     );
                     resolve({
                        errorCode: 0,
                        errorMessage: 'Login successfully!',
                        access_token: access_token,
                        user: user
                     })
                  }
               }
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let postForgotPassword = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (_.isEmpty(data) || !data.email) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing parameter: email'
            })
         } else {
            let user = await db.User.findOne({
               where: {
                  email: data.email
               }
            })

            if (!user) {
               resolve({
                  errorCode: 2,
                  errorMessage: 'Email not found'
               })
            } else {
               // Gui email reset password
               let token = randomDigitString(6);
               await db.User.update({
                  token: token,
               }, {
                  where: {
                     email: data.email
                  }
               })

               // send email
               await emailServices.sendEmailResetPassword(data.email, token);

               resolve({
                  errorCode: 0,
                  errorMessage: 'OK'
               })
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let postVerifyForgotPassword = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (!_.isEmpty(data)) {
            let check = checkIsValidInput(data, ['email', 'token', 'password']);

            if (!check.isValid) {
               resolve({
                  errorCode: 1,
                  errorMessage: `Missing parameter: ${check.element}`
               })
            } else {
               // console.log('xxxxxxxxxx check', data.email, data.token);
               let user = await db.User.findOne({
                  where: {
                     email: data.email,
                     token: data.token
                  }
               })

               if (!user) {
                  resolve({
                     errorCode: 2,
                     errorMessage: 'Invalid token or email'
                  })
               } else {
                  let hashedPassword = await hashValue(data.password);
                  await db.User.update({
                      PasswordHash: hashedPassword,
                     token: null
                  }, {
                     where: {
                        email: data.email
                     }
                  })

                  resolve({
                     errorCode: 0,
                     errorMessage: 'Password reset successfully'
                  })
               }
            }
         } else {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing parameter: email, token or password'
            })
         }
      } catch (error) {
         reject(error);
      }
   })
}

let getSearchUsersByUserName = (name) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (!name) {
            let data = await db.User.findAll({
               attributes: {
                  exclude: ['password', 'token']
               }
            });
            resolve({
               errorCode: 0,
               errorMessage: 'Get full users in database',
               data: data
            })
         } else {
            let data = await db.User.findAll({
               where: {
                  username: {
                     [Op.like]: `%${name}%`
                  }
               },
               attributes: {
                  exclude: ['password', 'token']
               }
            })
            resolve({
               errorCode: 0,
               errorMessage: 'Get users by username successfully',
               data: data
            })
         }
      } catch (error) {
         reject(error);
      }
   })
}

const userServices = {
    postCreateUser,
    putEditUser,
    getAllUsers,
    getUserById,
    deleteUser,
    postLogin,
    postForgotPassword,
    postVerifyForgotPassword,
    getSearchUsersByUserName
};

export default userServices;
