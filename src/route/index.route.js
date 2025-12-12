import systemConfig from '../config/system';
import { authJwt } from '../middlewares/client/authJwt.middleware';
import { requireRole } from '../middlewares/client/role.middleware';
import userRouter from './user.route';
import loginRouter from './login.route';
import projectRouter from './project.route';
import taskRouter from './task.route';
import commentRouter from './comment.route';
import projectMemberRouter from './projectMember.route';
import activityLogRouter from './activityLog.route';

module.exports = (app) => {

   app.use(
      systemConfig.prefixPath,
      loginRouter
   )
   app.use(
      systemConfig.prefixPath + '/user',
      //authJwt,
      //requireRole(['Admin', 'Leader']),
      userRouter
   )
   app.use(
      systemConfig.prefixPath + '/project',
      //authJwt,
      //requireRole(['Admin', 'Leader']),
      projectRouter
   )
   app.use(
      systemConfig.prefixPath + '/task',
      //authJwt,
      //requireRole(['Admin', 'Leader']),
      taskRouter
   )
   app.use(
      systemConfig.prefixPath + '/comment',
      //authJwt,
      commentRouter
   )
   app.use(
      systemConfig.prefixPath + '/project-member',
      //authJwt,
      //requireRole(['Admin', 'Leader']),
      projectMemberRouter
   )
   app.use(
      systemConfig.prefixPath + '/activity-log',
      activityLogRouter
   )
}