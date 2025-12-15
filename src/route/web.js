import express from "express";
import path from 'path';
//import authMiddleware from '../middlewares/client/auth.middleware';
import homeController from "../controllers/homeController";
import userController from "../controllers/userController";
import projectController from '../controllers/projectController';
import taskController from '../controllers/taskController';
import commentController from '../controllers/commentController';
import projectMemberController from '../controllers/projectMemberController';
import activityLogController from '../controllers/activityLogController';
import fileController from '../controllers/fileController';
import upload from '../middlewares/upload';
import taskHistoryController from '../controllers/taskHistoryController';
let router = express.Router();

let initWebRoutes = (app) => {
    const PROJECT_ROOT = path.resolve(); // Lấy đường dẫn gốc của dự án
    router.get('/', (req, res) => {
        return res.render("home/index", {
            title: "Home Page",
            data: 'Hello world',
            day: '2025-04-22'
        });
    });
    

    router.get('/login', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'login.html'));
    });
    router.get('/home', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'home.html'));
    });
    router.get('/register', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'register.html'));
    });
    router.get('/projects', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'projects.html'));
    });
    router.get('/account', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'account.html'));
    });
    router.get('/reports', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'reports.html'));
    });
    router.get('/tasks', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'tasks.html'));
    });
    router.get('/users', (req, res) => {
        return res.sendFile(path.join(PROJECT_ROOT, 'src', 'views', 'users.html'));
    });
   //router.get('/home', homeController.getHomePage);

   // API user
    router.post('/api/create-user', userController.postCreateUser);
    router.put('/api/edit-user', userController.putEditUser);
    //router.get('/api/get-all-users', authMiddleware.requiredAuth, userController.getAllUsers);
    router.get('/api/get-all-users', userController.getAllUsers);
    router.get('/api/get-user-by-id', userController.getUserById);
    router.delete('/api/delete-user-by-id', userController.deleteUser);
    router.get('/api/search-users-by-username', userController.getSearchUsersByUserName);
    router.get('/api/me', userController.getLogin);
    //API login
    router.post('/api/login', userController.postLogin);
    router.post('/api/logout', userController.postLogOut);
    router.post('/api/forgot-password', userController.postForgotPassword);
    router.post('/api/verify-forgot-password', userController.postVerifyForgotPassword);
    router.post('/api/register', userController.postCreateMember);
   // API project
    router.post('/api/create-project', projectController.postCreateProject);
    router.put('/api/edit-project', projectController.putEditProject);
    router.patch('/api/update-status-project', projectController.patchUpdateStatusProject);
    router.get('/api/get-all-projects', projectController.getAllProjects);
    router.get('/api/get-project-by-id', projectController.getProjectByIdOrCreatedBy);
    router.delete('/api/delete-project-by-id', projectController.deleteProject);
    router.get('/api/search-projects-by-name-status', projectController.getSearchProjectsByName);

   // API task
    router.post('/api/create-task', taskController.postCreateTask);
    router.get('/api/get-all-tasks', taskController.getAllTasks);
    router.put('/update-task-by-id', taskController.putUpdateTask); 
    //router.get('/api/get-task-by-id', taskController.getTaskById);
    router.delete('/api/delete-task-by-id', taskController.deleteTaskById);
    router.get('/api/search-tasks-by-title-status', taskController.getSearchTaskByTitleStatus)
    router.patch('/api/change-status-task-by-id', taskController.patchChangeStatusTaskById)
    //router.get('/api/get-tasks-by-project-id', taskController.getTaskByProjectId);

   // API comments
    router.post('/api/create-comment', commentController.postCreateComment);
    router.get('/api/get-all-comments-or-userId', commentController.getAllComments);
    router.delete('/api/delete-comment-by-id', commentController.deleteCommentById);

   // API projectMembers
   router.post('/api/create-project-member', projectMemberController.postCreateProjectMember);
   //router.get('/api/get-all-projectMember')

   // API activityLogs
    router.post('/api/create-activitylog', activityLogController.postCreateActivityLog)
    router.get('/api/get-all-activitylog-or-user-action', activityLogController.getAllActivityOrUserAction);
    // API file
    router.post('/api/upload-file', upload.single('file'), fileController.uploadFile);
    router.get('/api/get-files-by-task-id', fileController.getFilesByTaskId);
    router.delete('/api/delete-file-by-id', fileController.deleteFileById);
    router.delete('/api/delete-files-by-task-id', fileController.deleteFilesByTaskId);
    // API taskHistory
    router.post('/api/create-task-history', taskHistoryController.createHistory);
    router.get('/api/get-history-by-task-id', taskHistoryController.getHistoryByTaskId);
    router.delete('/api/delete-history-by-task-id', taskHistoryController.deleteHistoryByTaskId);
   return app.use("/", router);
}

export default initWebRoutes;