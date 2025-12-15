import db from '../models/index';

module.exports = {
    async createHistory(taskId, userId, field, oldValue, newValue) {
        const history = await db.TaskHistory.create({
            TaskID: taskId,
            ChangedBy: userId,
            ChangedField: field,
            OldValue: oldValue,
            NewValue: newValue,
            ChangedAt: new Date()
        });

        return db.TaskHistory.findOne({
            where: { HistoryID: history.HistoryID },
            include: [{ model: db.User, as: 'Changer', attributes: ['FullName'] }]
        });
    },

    async getHistoryByTaskId(taskId) {
        return db.TaskHistory.findAll({
            where: { TaskID: taskId },
            include: [{ model: db.User, as: 'Changer', attributes: ['FullName'] }],
            order: [['ChangedAt', 'DESC']]
        });
    },

    async deleteHistoryByTaskId(taskId) {
        await db.TaskHistory.destroy({ where: { TaskID: taskId } });
        return true;
    }
};
