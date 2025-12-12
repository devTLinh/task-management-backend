//require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmailResetPassword = async (email, otp) => {
   // console.log('check', email, otp);
   let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
         user: process.env.EMAIL_APP,
         pass: process.env.EMAIL_APP_PASSWORD
      }
   });

   let info = await transporter.sendMail({
      from: ' "Nguyễn Minh Quân" <nguyenminhquantth@gmail.com>',
      to: email,
      subject: 'Lấy lại mật khẩu',
      html: getBodyHTMLEmail(otp)
   })
}

let getBodyHTMLEmail = (otp) => {
   let result = `
      <h1>Xin chào!</h1>
      <p>Mã OTP của bạn là: ${otp}</p>
   `;

   return result;
}

let sendEmailChangeStatusToUsers = async (title, users, status) => {
   try {
      // console.log(users, status);
      let transporter = nodemailer.createTransport({
         host: 'smtp.gmail.com',
         port: 587,
         secure: false,
         auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD
         }
      });
      let emailPromises = users.map(user => {
         let htmlContent = `
            <h2>Xin chào ${user.name},</h2>
            <p>Trạng thái của dự án ${title} đã được cập nhật.</p>
            <p><b>Trạng thái mới:</b> ${status}</p>
            <br/>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
         `;
         return transporter.sendMail({
            from: '"Nguyễn Minh Quân" <nguyenminhquantth@gmail.com>',
            to: user.email,
            subject: 'Thông báo thay đổi trạng thái',
            html: htmlContent
         }); 
      })
      let results = await Promise.all(emailPromises);

   } catch (error) {
      console.error("LỖI THỰC TẾ TRONG USER SERVICE:", error); // <-- THÊM DÒNG NÀY
      console.log("Error from send Email change status!", error);
   }
}

module.exports = {
   sendEmailResetPassword: sendEmailResetPassword,
   sendEmailChangeStatusToUsers: sendEmailChangeStatusToUsers,
   
}