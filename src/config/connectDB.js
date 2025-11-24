import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('taskmanagement', 'root', "", {
   host: '127.0.0.1',
   port: 3306,
   dialect: 'mysql',
   logging: false
});

let connectDB = async () => {
   try {
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');
   } catch (error) {
      console.error(error);
   }
}

export default connectDB;