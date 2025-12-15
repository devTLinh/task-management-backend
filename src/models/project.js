module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
        ProjectID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        Name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        StartDate: {
            type: DataTypes.DATEONLY, // DATE trong MySQL
            allowNull: false
        },
        EndDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        Status: {
            type: DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Cancelled'),
            allowNull: false,
            defaultValue: 'Pending'
        },
        CreatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
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
        tableName: 'Projects',
        timestamps: false
    });

    Project.associate = (models) => {
        // Quan hệ n-1 (Project được tạo bởi 1 User)
        Project.belongsTo(models.User, { foreignKey: 'CreatedBy', targetKey: 'UserID', as: 'Creator' });

        // Quan hệ 1-n (Project có nhiều Tasks)
        Project.hasMany(models.Task, { foreignKey: 'ProjectID', sourceKey: 'ProjectID' });

        // Quan hệ n-n thông qua ProjectMember
        Project.belongsToMany(models.User, {
            through: models.ProjectMember,
            foreignKey: 'ProjectID',
            otherKey: 'UserID',
            as: 'Members'
        });
    };

    return Project;
};