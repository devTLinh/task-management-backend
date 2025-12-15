import { Op, where } from 'sequelize';
import { checkIsValidInput } from '../helpers/checkIsValidInput';
import db from '../models/index';
import _, { includes } from 'lodash';

let postCreateActivityLog = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (_.isEmpty(data)) {
                return resolve({
                    errorCode: 1,
                    errorMessage: 'Missing data'
                });
            }

            let check = checkIsValidInput(data, ['userId', 'action']);
            if (!check.isValid) {
                return resolve({
                    errorCode: 2,
                    errorMessage: `Missing parameter: ${check.element}`
                });
            }

            // ✅ Tạo log mới mỗi lần
            await db.ActivityLog.create({
                UserID: data.userId,
                Action: data.action
            });

            return resolve({
                errorCode: 0,
                errorMessage: 'Create activity log successfully!'
            });

        } catch (error) {
            reject(error);
        }
    });
};


let getAllActivityOrUserAction = (query) => {
   return new Promise(async (resolve, reject) => {
      try {
         const {userId, action} = query;
         let whereCondition = {};
         if(userId && action) {
            whereCondition = {
               [Op.and]: [
                  {UserID: {[Op.eq]: userId}},
                  {Action: {[Op.eq]: action}},
               ]
            }
         } else if(userId) {
            whereCondition = {
               UserID: userId
            }
         } else if(action) {
            whereCondition = {
               Action: action
            }
         }
         let data = await db.ActivityLog.findAll({
            where: whereCondition,
            include: [
               {
                  model: db.User,
                    as: 'Actor',
                  attributes: ['UserName','Email','FullName','Role']
               }
            ]
         })
         resolve({
            errorCode: 0,
            errorMessage: 'Get all activity log',
            data: data
         })
      } catch (error) {
         reject(error);
      }
   })
}

module.exports = {
   postCreateActivityLog,
   getAllActivityOrUserAction,

}