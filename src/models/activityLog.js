module.exports = (sequelize, DataTypes) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        LogID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        UserID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true, // Cho phép NULL (hành động hệ thống)
            comment: 'Người dùng thực hiện hành động (null nếu là hành động hệ thống)'
        },
        Action: {
            type: DataTypes.STRING(512),
            allowNull: false
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'ActivityLogs',
        timestamps: false // Không có UpdatedAt
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.User, { foreignKey: 'UserID', targetKey: 'UserID', as: 'Actor' });
    };

    return ActivityLog;
};