//import path from 'path'; // <--- Bổ sung
//import { fileURLToPath } from 'url'; // <--- Bổ sung

// Lấy đường dẫn tuyệt đối của thư mục chứa file hiện tại (src/config)
//const __dirname = path.dirname(fileURLToPath(import.meta.url));

let configViewEngine = (app) => {
    app.set("view engine", "ejs");
}

export default configViewEngine;