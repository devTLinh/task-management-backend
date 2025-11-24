import express from "express";
// import authMiddleware from '../middlewares/client/auth.middleware';
import homeController from "../controllers/homeController.js";
import userController from "../controllers/userController.js";
// import projectController from '../controllers/projectController';
// import taskController from '../controllers/taskController';
// import commentController from '../controllers/commentController';
// import projectMemberController from '../controllers/projectMemberController';
// import activityLogController from '../controllers/activityLogController';

let router = express.Router();

let initWebRoutes = (app) => {
   router.get('/', (req, res) => {
       return res.render("auth/login", {
           title: "Login",
           errorMessage: null,
           layout: false,
           user: null
      });
   });
    router.get('/login', (req, res) => {
        return res.render("auth/login", {
            title: "Login",
            errorMessage: null,
            layout: false
        });
    });

   router.get('/home', homeController.getHomePage);

   // API user
   // router.post('/api/create-user', userController.postCreateUser);
   // router.put('/api/edit-user', userController.putEditUser);
   // router.get('/api/get-all-users', authMiddleware.requiredAuth, userController.getAllUsers);
   // router.get('/api/get-user-by-id', userController.getUserById);
   // router.delete('/api/delete-user-by-id', userController.deleteUser);
   // router.get('/api/search-users-by-username', userController.getSearchUsersByUserName);

   // API login
   router.post('/api/login', userController.postLogin);
   router.post('/api/logout', userController.postLogOut);
   router.post('/api/forgot-password', userController.postForgotPassword);
   router.post('/api/verify-forgot-password', userController.postVerifyForgotPassword);
    // Bổ sung Route GET để hiển thị trang đăng ký
   router.get('/register', (req, res) => {
        // Hiển thị form đăng ký
        return res.render('auth/register', {
            pageTitle: 'Create Account — TaskManager',
            errorMessage: null, // Biến hiển thị lỗi
            oldValues: {},       // Biến giữ lại dữ liệu form cũ
            layout: false
        });
   });
    // Bổ sung Route POST để xử lý form đăng ký
    router.post('/register', userController.postRegister);   // <--- Mới

   // API project
   // router.post('/api/create-project', projectController.postCreateProject);
   // router.put('/api/edit-project', projectController.putEditProject);
   // router.patch('/api/update-status-project', projectController.patchUpdateStatusProject);
   // router.get('/api/get-all-projects', projectController.getAllProjects);
   // router.get('/api/get-project-by-id', projectController.getProjectById);
   // router.delete('/api/delete-project-by-id', projectController.deleteProject);
   // router.get('/api/search-projects-by-name-status', projectController.getSearchProjectsByName);

   // API task
   // router.post('/api/create-task', taskController.postCreateTask);
   // router.get('/api/get-all-tasks', taskController.getAllTasks);
   // router.get('/api/get-task-by-id', taskController.getTaskById);
   // router.delete('/api/delete-task-by-id', taskController.deleteTaskById);
   // router.get('/api/search-tasks-by-title-status', taskController.getSearchTaskByTitleStatus)
   // router.patch('/api/change-status-task-by-id', taskController.patchChangeStatusTaskById)
   // router.get('/api/get-tasks-by-project-id', taskController.getTaskByProjectId);

   // API comments
   // router.post('/api/create-comment', commentController.postCreateComment);
   // router.get('/api/get-all-comments-or-userId', commentController.getAllComments);
   // router.delete('/api/delete-comment-by-id', commentController.deleteCommentById);

   // API projectMembers
   // router.post('/api/create-project-member', projectMemberController.postCreateProjectMember);
   // router.get('/api/get-all-projectMember')

   // API activityLogs
   // router.post('/api/create-activitylog', activityLogController.postCreateActivityLog)
   // router.get('/api/get-all-activitylog-or-user-action', activityLogController.getAllActivityOrUserAction);

   return app.use("/", router);
}

export default initWebRoutes;