import taskServices from '../services/taskServices';

let postCreateTask = async (req, res) => {
   try {
      let data = await taskServices.postCreateTask(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from the server! Contact Nguyen Quan'
      })
   }
}

let getAllTasks = async (req, res) => {
   try {
      let data = await taskServices.getAllTasks();
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server ! contact Nguyen Quan'
      })
   }
}

let getTaskByIdOrAssigntedTo = async (req, res) => {
   try {
      let data = await taskServices.getTaskByIdOrAssigntedTo(req.body);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server ! contact Nguyen Quan'
      })
   }
}

let deleteTaskById = async (req, res) => {
   try {
      let data = await taskServices.deleteTaskById(req.query.id);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! contact Nguyen Quan'
      })
   }
}

let getSearchTaskByTitleStatus = async (req, res) => {
   try {
      let data = await taskServices.getSearchTaskByTitleStatus(req.query);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan'
      })
   }
}

let patchChangeStatusTaskById = async (req, res) => {
   try {
      let data = await taskServices.patchChangeStatusTaskById(req.query);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan'
      })
   }
}
let putUpdateTask = async (req, res) => {
    try {
        let data = await taskServices.putUpdateTask(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            errorCode: -1,
            errorMessage: 'Error from server! Contact Nguyen Quan'
        })
    }
}
let getAllTaskByProjectId = async (req, res) => {
   try {
      let data = await taskServices.getAllTaskByProjectId(req.query.projectId);
      return res.status(200).json(data);
   } catch (error) {
      console.log(error);
      return res.status(200).json({
         errorCode: -1,
         errorMessage: 'Error from server! Contact Nguyen Quan'
      })
   }
}  

module.exports = {
   postCreateTask,
   getAllTasks,
   getTaskByIdOrAssigntedTo,
   deleteTaskById,
   getSearchTaskByTitleStatus,
   patchChangeStatusTaskById,
    getAllTaskByProjectId,
    putUpdateTask
}