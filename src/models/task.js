module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define('Task', {
        TaskID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ProjectID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        AssignedTo: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true, // Cho phép NULL (người được giao là NULL nếu chưa giao)
            comment: 'Người được giao việc (null nếu chưa giao)'
        },
        Title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        Status: {
            type: DataTypes.ENUM('ToDo', 'InProgress', 'InReview', 'Done', 'Blocked'),
            allowNull: false,
            defaultValue: 'ToDo'
        },
        Priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
            allowNull: false,
            defaultValue: 'Medium'
        },
        DueDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW
        }
    }, {
        tableName: 'Tasks',
        timestamps: false
    });

    Task.associate = (models) => {
        Task.belongsTo(models.Project, { foreignKey: 'ProjectID', targetKey: 'ProjectID' });
        Task.belongsTo(models.User, { foreignKey: 'AssignedTo', targetKey: 'UserID', as: 'Assignee' });
        Task.hasMany(models.Comment, { foreignKey: 'TaskID', sourceKey: 'TaskID' });
        Task.hasMany(models.File, { foreignKey: 'TaskID', sourceKey: 'TaskID' });
        Task.hasMany(models.TaskHistory, { foreignKey: 'TaskID', sourceKey: 'TaskID' });
    };

    return Task;
};