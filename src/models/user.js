'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Định nghĩa các mối quan hệ (Associations)
     */
    static associate(models) {
      // Quan hệ 1-n
      User.hasMany(models.Project, { 
        foreignKey: 'CreatedBy', // Phải dùng PascalCase
        sourceKey: 'UserID', 
        as: 'CreatedProjects' 
      });
      User.hasMany(models.Task, { 
        foreignKey: 'AssignedTo', 
        sourceKey: 'UserID', 
        as: 'AssignedTasks' 
      });
      User.hasMany(models.Comment, { 
        foreignKey: 'UserID', 
        sourceKey: 'UserID' 
      });
      User.hasMany(models.File, { 
        foreignKey: 'UploadedBy', 
        sourceKey: 'UserID' 
      });
      User.hasMany(models.TaskHistory, { 
        foreignKey: 'ChangedBy', 
        sourceKey: 'UserID' 
      });
      User.hasMany(models.ActivityLog, { 
        foreignKey: 'UserID', 
        sourceKey: 'UserID' 
      });

      // Quan hệ n-n thông qua ProjectMember
      User.belongsToMany(models.Project, {
        through: models.ProjectMember,
        foreignKey: 'UserID',
        otherKey: 'ProjectID',
        as: 'Projects'
      });
      
      // Quan hệ 1-n với ProjectMember (cho bảng liên kết)
      User.hasMany(models.ProjectMember, { 
        foreignKey: 'UserID', 
        sourceKey: 'UserID', 
        as: 'ProjectMemberships' 
      });
    }
  }
  
  User.init({
    // Khóa chính: UserID (Thay thế cho 'id' mặc định)
    UserID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // Tên người dùng: UNIQUE và NOT NULL
    UserName: {
      type: DataTypes.STRING(50), // Khớp VARCHAR(50)
      allowNull: false,
      unique: true
    },
    // Email: UNIQUE và NOT NULL
    Email: {
      type: DataTypes.STRING(100), // Khớp VARCHAR(100)
      allowNull: false,
      unique: true
    },
    // Hash Mật khẩu: CHAR(60) cho bcrypt hash
    PasswordHash: {
      type: DataTypes.CHAR(60), // Khớp CHAR(60)
      allowNull: false,
      comment: 'Lưu trữ hash của mật khẩu (ví dụ: bcrypt)'
    },
    // Tên đầy đủ
    FullName: {
      type: DataTypes.STRING(100), // Khớp VARCHAR(100)
      allowNull: false
    },
    // Vai trò: Sử dụng ENUM
    Role: {
      type: DataTypes.ENUM('Admin', 'Manager', 'Member'),
      allowNull: false,
      defaultValue: 'Member'
    },
    // CreatedAt: Định nghĩa thủ công
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // UpdatedAt: Định nghĩa thủ công
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    }
    // Loại bỏ trường 'token' nếu bạn quản lý JWT qua cookie/header
    // Nếu bạn vẫn cần lưu 'token' vào DB, hãy thêm lại:
    // Token: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // Khớp với tên bảng trong DB
    timestamps: false // Tắt timestamps mặc định của Sequelize
  });

  return User;
};