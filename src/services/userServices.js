import db from '../models/index';
import _ from 'lodash';
import emailServices from './emailServices';
import {
   checkIsValidInput
} from '../helpers/checkIsValidInput';
import {
   hashValue
} from '../helpers/hashValue';
import {
   randomDigitString
} from '../helpers/randomDigitString';
import {
   Op
} from 'sequelize';
import {
   randomString
} from '../helpers/randomString';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
require('dotenv').config();
let postCreateMember = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (_.isEmpty(data)) {
                return resolve({
                    errorCode: 1,
                    errorMessage: 'Missing data'
                });
            }
            let check = checkIsValidInput(data, ['email', 'password', 'fullName']);
            if (!check.isValid) {
                return resolve({
                    errorCode: 2,
                    errorMessage: `Missing parameter: ${check.element}`
                });
            }
            let emailExist = await db.User.findOne({
                where: { Email: data.email }
            });

            if (emailExist) {
                return resolve({
                    errorCode: 2,
                    errorMessage: 'Email already exists'
                });
            }
            const generatedUserName = data.email.split('@')[0];
            let hashedPassword = await hashValue(data.password);
            let newUser = await db.User.create({
                UserName: generatedUserName,
                Email: data.email,
                PasswordHash: hashedPassword,
                FullName: data.fullName,
                Role: 'Member'
            });

            return resolve({
                errorCode: 0,
                errorMessage: 'Create user successfully',
                user: newUser
            });

        } catch (error) {
            reject(error);
        }
    });
};

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
            let check = checkIsValidInput(data, ['id', 'userName', 'email', 'fullName', 'role']);
            if (!check.isValid) {
                return resolve({
                    errorCode: 1,
                    errorMessage: `Missing parameter: ${check.element}`
                });
            }

            // ✅ Kiểm tra email trùng
            let existing = await db.User.findOne({
                where: {
                    Email: data.email,
                    UserID: { [Op.ne]: data.id }
                }
            });

            if (existing) {
                return resolve({
                    errorCode: 3,
                    errorMessage: "Email already exists"
                });
            }

            // ✅ Tìm user theo ID
            let user = await db.User.findOne({
                where: { UserID: data.id }
            });

            if (!user) {
                return resolve({
                    errorCode: 2,
                    errorMessage: "User not found"
                });
            }

            // ✅ Update
            let hashedPassword = data.password
                ? await hashValue(data.password)
                : user.PasswordHash;

            await db.User.update(
                {
                    UserName: data.userName,
                    Email: data.email,
                    FullName: data.fullName,
                    PasswordHash: hashedPassword,
                    Role: data.role
                },
                { where: { UserID: data.id } }
            );

            return resolve({
                errorCode: 0,
                errorMessage: "Update user successfully"
            });

        } catch (error) {
            reject(error);
        }
    });
};


let getAllUsers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                attributes: {
                    exclude: ['Password']
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
                        UserID: id
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
                    resolve(user);
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
                        UserID: id
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
                            UserID: id
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
            if (_.isEmpty(data)) {
                return resolve({
                    errorCode: 1,
                    errorMessage: 'Missing data'
                });
            }

            let check = checkIsValidInput(data, ['email', 'password']);
            if (!check.isValid) {
                return resolve({
                    errorCode: 2,
                    errorMessage: `Missing parameter: ${check.element}`
                });
            }

            let user = await db.User.findOne({
                where: { Email: data.email },
                raw: true
            });

            if (!user) {
                return resolve({
                    errorCode: 3,
                    errorMessage: 'User not found or email not exist !'
                });
            }
            let checkPassword = bcrypt.compareSync(data.password, user.PasswordHash);
            if (!checkPassword) {
                return resolve({
                    errorCode: 4,
                    errorMessage: 'Wrong password!'
                });
            }

            delete user.PasswordHash;

            const payload = {
                userId: user.UserID,
                email: user.Email,
                fullName: user.FullName,
                role: user.Role
            };

            const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRE
            });

            return resolve({
                errorCode: 0,
                errorMessage: 'Login successfully!',
                access_token,
                user
            });

        } catch (error) {
            reject(error);
        }
    });
};

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
                     password: hashedPassword,
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

module.exports = {
   postCreateUser: postCreateUser,
   putEditUser: putEditUser,
   getAllUsers: getAllUsers,
   getUserById: getUserById,
   deleteUser: deleteUser,
   postLogin: postLogin,
   postForgotPassword: postForgotPassword,
   postVerifyForgotPassword: postVerifyForgotPassword,
   getSearchUsersByUserName: getSearchUsersByUserName,
   postCreateMember: postCreateMember
}