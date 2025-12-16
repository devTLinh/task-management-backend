import { checkIsValidInput } from '../helpers/checkIsValidInput';
import db from '../models/index';
import _, { includes } from 'lodash';
import { Op, where } from 'sequelize';
import emailServices from './emailServices';

let postCreateProject = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (_.isEmpty(data)) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing project data'
            })
         } else {
            let check = checkIsValidInput(data, ['name', 'description', 'startDate', 'endDate', 'status','createdBy']);

            if (!check.isValid) {
               resolve({
                  errorCode: 2,
                  errorMessage: `Missing parameters: ${check.element}`
               })
            } else {
               let project = await db.Project.findOne({
                  where: {name: data.name}
               })

               if(project) {
                  resolve({
                     errorCode: 3,
                     errorMessage: 'Project name is already in use'
                  })
               } else {
                  await db.Project.create({
                     Name: data.name,
                     Description: data.description,
                     StartDate: data.startDate,
                     EndDate: data.endDate,
                     Status: data.status,
                     CreatedBy: data.createdBy
                  })

                  resolve({
                     errorCode: 0,
                     errorMessage: 'Create project successfully'
                  })
               }
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let putEditProject = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (_.isEmpty(data)) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing project data'
            })
         } else {
            let check = checkIsValidInput(data, ['id', 'name', 'description', 'startDate', 'endDate', 'status']);

            if (!check.isValid) {
               resolve({
                  errorCode: 2,
                  errorMessage: `Missing parameters: ${check.element}`
               })
            } else {
               let project = await db.Project.findOne({
                   where: {
                       ProjectID: data.id
                  }
               });

               if (!project) {
                  resolve({
                     errorCode: 3,
                     errorMessage: 'Project not found'
                  })
               } else {
                  project.Name = data.name;
                  project.Description = data.description;
                  project.StartDate = data.startDate;
                  project.EndDate = data.endDate;
                  project.Status = data.status;

                  await project.save();

                  resolve({
                     errorCode: 0,
                     errorMessage: 'Update project successfully',
                     project: project
                  });
               }
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let patchUpdateStatusProject = async (data) => {
   if (_.isEmpty(data)) {
      return {
         errorCode: 1,
         errorMessage: 'Missing project data'
      };
   }

   const check = checkIsValidInput(data, ['id', 'status']);
   if (!check.isValid) {
      return {
         errorCode: 2,
         errorMessage: `Missing parameters: ${check.element}`
      };
   }

   const project = await db.Project.findOne({
       where: { ProjectID: data.id }
   });

   if (!project) {
      return {
         errorCode: 3,
         errorMessage: 'Project not found'
      };
   }

   if (project.Status === data.status) {
      return {
         errorCode: 4,
         errorMessage: 'New status must be different from old status!'
      };
   }

   project.Status = data.status;
   await project.save();

   // Send email
   let users = await db.ProjectMember.findAll({
      where: {ProjectId: data.id},
      include: [
         {
            model: db.User,
            attributes: ['userName', 'fullName', 'email']
         }
      ]
   })
   let arrayUsers = users.map(user => {
      return {
         name: user.projectMemeberInfo.fullName,
         email: user.projectMemeberInfo.email
      }
   })
   // console.log(arrayUsers);
   await emailServices.sendEmailChangeStatusToUsers(project.Name, arrayUsers, data.status);
   // End Send email

   return {
      errorCode: 0,
      errorMessage: 'Update project status successfully',
      project,
      users
   };
};


let getAllProjects = () => {
   return new Promise(async (resolve, reject) => {
      try {
         let data = await db.Project.findAll(
            {
               include: [
                    {
                        model: db.User,
                        as: 'Creator',
                        attributes: ['UserName', 'FullName', 'Email', 'Role']
                    },
                    {
                        model: db.User,
                        as: 'Members',
                        attributes: ['UserID','UserName', 'FullName', 'Email', 'Role']
                    }
               ]
            }
         );
         resolve({
            errorCode: 0,
            errorMessage: 'Get all projects successfully',
            projects: data
         });
      } catch (error) {
         reject(error);
      }
   })
}

let getProjectByIdOrCreatedBy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id, createdBy } = data || {};

            const includeConfig = [
                {
                    model: db.User,
                    as: 'Creator',
                    attributes: ['UserID', 'UserName', 'FullName', 'Email', 'Role']
                },
                {
                    model: db.User,
                    as: 'Members', 
                    attributes: ['UserID', 'UserName', 'FullName', 'Email'],
                    through: {
                        attributes: ['Role', 'JoinedAt'] 
                    }
                }
            ];

            // ✅ Trường hợp: tìm theo cả id + createdBy
            if (id && createdBy) {
                const project = await db.Project.findOne({
                    where: { ProjectID: id, CreatedBy: createdBy },
                    include: includeConfig
                });

                if (!project) {
                    resolve({
                        errorCode: 2,
                        errorMessage: "Project with this id and createdBy does not exist"
                    });
                } else {
                    resolve({
                        errorCode: 0,
                        errorMessage: "Get project by id and createdBy successfully",
                        project
                    });
                }
                return;
            }
            if (id) {
                const project = await db.Project.findOne({
                    where: { ProjectID: id },
                    include: includeConfig
                });

                if (!project) {
                    resolve({
                        errorCode: 2,
                        errorMessage: "Project not found"
                    });
                } else {
                    resolve({
                        errorCode: 0,
                        errorMessage: "Get project by id successfully",
                        project
                    });
                }
                return;
            }
            if (createdBy) {
                const projects = await db.Project.findAll({
                    where: { CreatedBy: createdBy },
                    include: includeConfig
                });

                resolve({
                    errorCode: 0,
                    errorMessage: "Get all projects by createdBy successfully",
                    projects
                });
                return;
            }
            resolve({
                errorCode: 1,
                errorMessage: "Missing parameter id or createdBy"
            });

        } catch (error) {
            reject(error);
        }
    });
};


let deleteProject = (id) => {
   return new Promise(async (resolve, reject) => {
      try {
         if (!id) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing project id'
            })
         } else {
            let project = await db.Project.findOne({
                where: {
                    ProjectID: id
               }
            })

            if (!project) {
               resolve({
                  errorCode: 2,
                  errorMessage: 'Project not found'
               })
            } else {
               await project.destroy();

               resolve({
                  errorCode: 0,
                  errorMessage: 'Delete project by id successfully'
               })
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

let getSearchProjectsByName = (query) => {
   return new Promise(async (resolve, reject) => {
      try {
         let {name, status} = query;
         let whereCondition = {};
         if(name && status) {
            whereCondition = {
               [Op.and]: [
                  {Name: {[Op.like]: `%${name}%`}},
                  {Status: {[Op.eq]: status}}
               ]
            }
         } else if(name) {
            whereCondition = {
               Name: {[Op.like]: `%${name}%`}
            }
         } else if (status) {
            whereCondition = {
               Status: {[Op.eq]: status}
            }
         } else {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing parameter!'
            })
         }
         // find data
         let data = await db.Project.findAll({
            where: whereCondition,
            include: [
               {
                  model: db.User,
                  as: 'Creator',
                  attributes: ['UserName', 'FullName', 'Email', 'Role']
               }
            ]
         })

         resolve({
            errorCode: 0,
            errorMessage: 'Search by name and status successfully !',
            data: data
         })
      } catch (error) {
         reject(error);
      }
   })
}

module.exports = {
   postCreateProject: postCreateProject,
   putEditProject: putEditProject,
   patchUpdateStatusProject: patchUpdateStatusProject,
   getAllProjects: getAllProjects,
   getProjectByIdOrCreatedBy: getProjectByIdOrCreatedBy,
   deleteProject: deleteProject,
   getSearchProjectsByName: getSearchProjectsByName,

}