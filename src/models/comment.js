module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('Comment', {
        CommentID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        TaskID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        UserID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        Content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'Comments',
        timestamps: false
    });

    Comment.associate = (models) => {
        Comment.belongsTo(models.Task, { foreignKey: 'TaskID', targetKey: 'TaskID' });
        Comment.belongsTo(models.User, { foreignKey: 'UserID', targetKey: 'UserID' });
    };

    return Comment;
};