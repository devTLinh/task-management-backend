module.exports = (sequelize, DataTypes) => {
    const TaskHistory = sequelize.define('TaskHistory', {
        HistoryID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        TaskID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        ChangedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        ChangedField: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        OldValue: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        NewValue: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ChangedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'TaskHistory',
        timestamps: false // Kh�ng c� UpdatedAt
    });

    TaskHistory.associate = (models) => {
        TaskHistory.belongsTo(models.Task, { foreignKey: 'TaskID', targetKey: 'TaskID' });
        TaskHistory.belongsTo(models.User, { foreignKey: 'ChangedBy', targetKey: 'UserID', as: 'Changer' });
    };

    return TaskHistory;
};