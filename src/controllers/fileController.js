const fileService = require('../services/fileService');

module.exports = {
    async uploadFile(req, res) {
        try {
            const { TaskID } = req.body;
            const file = req.file;

            if (!file) return res.status(400).json({ message: 'No file uploaded' });

            const result = await fileService.uploadFile(TaskID, file, req.user.UserID);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Upload failed' });
        }
    },

    async getFilesByTaskId(req, res) {
        try {
            const { TaskID } = req.query;
            const files = await fileService.getFilesByTaskId(TaskID);
            res.json(files);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching files' });
        }
    },

    async deleteFileById(req, res) {
        try {
            const { FileID } = req.query;
            const ok = await fileService.deleteFileById(FileID);
            if (!ok) return res.status(404).json({ message: 'File not found' });
            res.json({ message: 'File deleted' });
        } catch (err) {
            res.status(500).json({ message: 'Error deleting file' });
        }
    },

    async deleteFilesByTaskId(req, res) {
        try {
            const { TaskID } = req.query;
            await fileService.deleteFilesByTaskId(TaskID);
            res.json({ message: 'All files deleted for task' });
        } catch (err) {
            res.status(500).json({ message: 'Error deleting files' });
        }
    }
};
