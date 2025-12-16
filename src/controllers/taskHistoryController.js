const taskHistoryService = require('../services/taskHistoryService');

module.exports = {
    async createHistory(req, res) {
        try {
            const {UserID, TaskID, ChangedField, OldValue, NewValue } = req.body;

            const result = await taskHistoryService.createHistory(
                TaskID,
                UserID,
                ChangedField,
                OldValue,
                NewValue
            );

            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error creating history' });
        }
    },

    async getHistoryByTaskId(req, res) {
        try {
            const { TaskID } = req.query;
            const list = await taskHistoryService.getHistoryByTaskId(TaskID);
            res.json(list);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching history' });
        }
    },

    async deleteHistoryByTaskId(req, res) {
        try {
            const { TaskID } = req.query;
            await taskHistoryService.deleteHistoryByTaskId(TaskID);
            res.json({ message: 'History deleted' });
        } catch (err) {
            res.status(500).json({ message: 'Error deleting history' });
        }
    }
};
