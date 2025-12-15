module.exports = (sequelize, DataTypes) => {
    const ProjectMember = sequelize.define('ProjectMember', {
        MemberID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ProjectID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        UserID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        Role: {
            type: DataTypes.ENUM('ProjectManager', 'TeamLead', 'Developer', 'Viewer'),
            allowNull: false,
            defaultValue: 'Developer'
        },
        JoinedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'ProjectMembers',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['ProjectID', 'UserID'] // Thiết lập UNIQUE KEY cho cặp cột
            }
        ]
    });

    ProjectMember.associate = (models) => {
        ProjectMember.belongsTo(models.Project, { foreignKey: 'ProjectID', targetKey: 'ProjectID' });
        ProjectMember.belongsTo(models.User, { foreignKey: 'UserID', targetKey: 'UserID' });
    };

    return ProjectMember;
};