import db from '../models/index';
const fs = require('fs');

module.exports = {
    async uploadFile(taskId, file, userId) {
        const newFile = await db.File.create({
            TaskID: taskId,
            FileName: file.originalname,
            FilePath: file.path,
            UploadedBy: userId,
            CreatedAt: new Date()
        });

        return db.File.findOne({
            where: { FileID: newFile.FileID },
            include: [{ model: db.User, as: 'Uploader', attributes: ['FullName'] }]
        });
    },

    async getFilesByTaskId(taskId) {
        return db.File.findAll({
            where: { TaskID: taskId },
            include: [{ model: db.User, as: 'Uploader', attributes: ['FullName'] }],
            order: [['CreatedAt', 'DESC']]
        });
    },

    async deleteFileById(fileId) {
        const file = await db.File.findByPk(fileId);
        if (!file) return null;

        if (fs.existsSync(file.FilePath)) fs.unlinkSync(file.FilePath);

        await file.destroy();
        return true;
    },

    async deleteFilesByTaskId(taskId) {
        const files = await db.File.findAll({ where: { TaskID: taskId } });

        for (const f of files) {
            if (fs.existsSync(f.FilePath)) fs.unlinkSync(f.FilePath);
            await f.destroy();
        }

        return true;
    }
};
