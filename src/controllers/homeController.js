/*import db from '../models/index';

let getHomePage = async(req, res) => {
   try {
      let data = await db.User.findAll();
      return res.json(data);
   } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
   }
}

module.exports = {
   getHomePage: getHomePage,

}
*/
import db from '../models/index.js';
// Giả định middleware hoặc passport đã đặt biến req.user nếu người dùng đã đăng nhập.
// Nếu không sử dụng middleware xác thực, req.user sẽ là undefined.

let getHomePage = async(req, res) => {
    try {
        // Biến `user` được truyền vào View. Nó sẽ là đối tượng người dùng
        // nếu đã đăng nhập (req.user), hoặc null nếu chưa đăng nhập.
        //const user = req.user || null;

        // 1. Loại bỏ db.User.findAll() vì Home View không cần hiển thị toàn bộ người dùng.
        // 2. Sử dụng res.render() để hiển thị file EJS.
        console.log('home');
        return res.render('home/home', {
            // Biến 'title' hiển thị trên tab trình duyệt
            title: 'Welcome to TaskManager', 
            // Biến 'active' để highlight menu (nếu cần)
            active: 'home', 
            // Biến 'user' cho logic if/else trong View (để hiển thị nút Đăng nhập/Dashboard)
            user: null, 
        });

    } catch (error) {
        // Ghi lại lỗi và trả về lỗi 500 nếu có vấn đề trong quá trình render/xử lý
        console.error('Error in getHomePage:', error);
        return res.status(500).send('Internal Server Error while loading home page.');
    }
}

// Chuyển sang Default Export để file web.js có thể import toàn bộ object
const controller = {
    getHomePage: getHomePage,
    // Thêm các hàm khác ở đây
};

export default controller;
