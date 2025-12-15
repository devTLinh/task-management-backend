module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
        FileID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        TaskID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        FileName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        FilePath: {
            type: DataTypes.STRING(512),
            allowNull: false
        },
        UploadedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        tableName: 'Files',
        timestamps: false // Kh�ng c� UpdatedAt
    });

    File.associate = (models) => {
        File.belongsTo(models.Task, { foreignKey: 'TaskID', targetKey: 'TaskID' });
        File.belongsTo(models.User, { foreignKey: 'UploadedBy', targetKey: 'UserID', as: 'Uploader' });
    };

    return File;
};