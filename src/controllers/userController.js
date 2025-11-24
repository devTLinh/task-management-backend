import userServices from '../services/userServices.js';

let postCreateUser = async (req, res) => {
   try {
      let data = await userServices.postCreateUser(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let putEditUser = async (req, res) => {
   try {
      let data = await userServices.putEditUser(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let getAllUsers = async (req, res) => {
   try {
      let data = await userServices.getAllUsers();

      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let getUserById = async(req, res) => {
   try {
      let data = await userServices.getUserById(req.query.id);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let deleteUser = async (req, res) => {
   try {
      let data = await userServices.deleteUser(req.query.id);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let postLogin = async (req, res) => {
   try {
      let response = await userServices.postLogin(req.body);
      if(response && response.errorCode === 0) {
         res.cookie("token", response.user.token, {
            maxAge: 60*60*1000,
            httpOnly: true,
            secure: false
         });
         // delete response.user.token;
      }
      return res.status(200).json(response);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let postLogOut = async (req, res) => {
   try {
      res.clearCookie("token");
      return res.status(200).json({
         errorCode: 0,
         errorMessage: 'Logout successfully!'
      })
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan.'
      })
   }
}

let postForgotPassword = async (req, res) => {
   try {
      let data = await userServices.postForgotPassword(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let postVerifyForgotPassword = async (req, res) => {
   try {
      let data = await userServices.postVerifyForgotPassword(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan'
      })
   }
}

let getSearchUsersByUserName = async (req, res) => {
   try {
      let data = await userServices.getSearchUsersByUserName(req.query.name);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan'
      })
   }
}

let postRegister = async (req, res) => {
    // Xử lý dữ liệu POST từ form
    const { email, password, fullName } = req.body;

    // * TẠM THỜI GÁN DỮ LIỆU MẶC ĐỊNH BỊ THIẾU *
    // Vì service yêu cầu 5 trường, ta bổ sung 2 trường còn thiếu
    const dataWithDefaults = {
        ...req.body,
        userName: req.body.email.split('@')[0], // Gán userName bằng phần trước @ của email
        role: 'Member' // Gán vai trò mặc định
    };

    try {
        // Gọi Service với dữ liệu đầy đủ
        let response = await userServices.postCreateUser(dataWithDefaults);

        if (response && response.errorCode === 0) {
            // Đăng ký thành công: Chuyển hướng về trang đăng nhập
            return res.redirect('/login?registered=success');
        } else {
            // Đăng ký thất bại: Render lại trang với thông báo lỗi
            return res.render('auth/register', {
                pageTitle: 'Create Account — TaskManager',
                errorMessage: response.errorMessage || 'Đăng ký thất bại. Vui lòng thử lại.',
                oldValues: { email, fullName }
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        return res.render('auth/register', {
            pageTitle: 'Create Account — TaskManager',
            errorMessage: 'Lỗi server! Không thể đăng ký.',
            oldValues: { email, fullName }
        });
    }
}
// ...
const userController = {
    postCreateUser,
    putEditUser,
    getAllUsers,
    getUserById,
    deleteUser,
    postLogin,
    postLogOut,
    postForgotPassword,
    postVerifyForgotPassword,
    getSearchUsersByUserName,
    postRegister
};

export default userController