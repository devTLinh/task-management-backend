import { checkIsValidInput } from '../helpers/checkIsValidInput';
import db from '../models/index';
import _ from 'lodash';

let postCreateProjectMember = (data) => {
   return new Promise(async (resolve, reject) => {
      try {
         if(_.isEmpty(data)) {
            resolve({
               errorCode: 1,
               errorMessage: 'Missing data'
            })
         } else {
            let check = checkIsValidInput(data, ['projectId','userId','role','joinedAt']);
            if(!check.isValid) {
               resolve({
                  errorCode: 2,
                  errorMessage: `Missing parameters: ${check.element}`
               })
            } else {
               let [projectMember, checkInValid] = await db.ProjectMember.findOrCreate({
                  where: {
                     ProjectID: data.projectId,
                     UserID: data.userId
                  },
                  defaults: {
                     ProjectID: data.projectId,
                     UserID: data.userId,
                     Role: data.role,
                     JoinedAt: data.joinedAt
                  }
               })
               if(checkInValid) {
                  resolve({
                     errorCode: 0,
                     errorMessage: 'Create project member successfully!'
                  })
               } else {
                  resolve({
                     errorCode: 3,
                     errorMessage: 'Create not successfully!'
                  })
               }
            }
         }
      } catch (error) {
         reject(error);
      }
   })
}

module.exports = {
   postCreateProjectMember
}