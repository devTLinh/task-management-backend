import activityLogServices from '../services/activityLogServices';

let postCreateActivityLog = async (req, res) => {
    try {
      let data = await activityLogServices.postCreateActivityLog(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from Server! Contact Nguyen Quan'
      })
   }
}

let getAllActivityOrUserAction = async (req, res) => {
   try {
      let data = await activityLogServices.getAllActivityOrUserAction(req.query);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from Server!'
      })
   }
}

module.exports = {
   postCreateActivityLog,
   getAllActivityOrUserAction
}