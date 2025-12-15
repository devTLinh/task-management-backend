import userServices from '../services/userServices';

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
let postCreateMember = async (req, res) => {
    try {
        let data = await userServices.postCreateMember(req.body);
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
let getLogin = async (req, res) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ errorCode: 1, errorMessage: 'Chưa đăng nhập' });
    }
    const jwt = require('jsonwebtoken');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userServices.getUserById(decoded.userId);
        if (!user) {
            return res.status(404).json({ errorCode: 1, errorMessage: 'User not found' });
        }
        return res.status(200).json({ errorCode: 0, user });

    } catch (err) {
        return res.status(401).json({ errorCode: 1, errorMessage: 'Token không hợp lệ' });
    }
};
let postLogin = async (req, res) => {
   try {
      let response = await userServices.postLogin(req.body);
      if(response && response.errorCode === 0) {
         //res.cookie("token", response.user.token, {
         //   maxAge: 60*60*1000,
         //   httpOnly: true,
         //   secure: false
         //});
        res.cookie("token", response.access_token, {
            httpOnly: true,
            secure: false,        // bật khi chạy HTTPS
            sameSite: "Strict",
            maxAge: 60 * 60 * 1000   // 1 giờ
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

module.exports = {
   postCreateUser: postCreateUser,
   putEditUser: putEditUser,
   getAllUsers: getAllUsers,
   getUserById: getUserById,
   deleteUser: deleteUser,
   postLogin: postLogin,
   postLogOut: postLogOut,
   postForgotPassword: postForgotPassword,
   postVerifyForgotPassword: postVerifyForgotPassword,
   getSearchUsersByUserName: getSearchUsersByUserName,
   getLogin: getLogin,
    postCreateMember: postCreateMember
} 