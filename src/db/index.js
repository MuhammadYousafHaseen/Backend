import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`/n Database connected !! DB HOST: ${connectionInstance.connection.host} `);
  } catch (error) {
    console.log("Database Connection Error:", error);
    process.exit(1); // 1 is for uncaught exception
  }
};


export default connectDB;



// const connectDB = async () => {
//     try {
//       const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
//       console.log(`Database connected: ${connection.connection.host}`);
//     } catch (error) {
//       console.error('Database Connection Error:', error);
//       console.error('Ensure your MongoDB URI and Network settings are correct.');
//       process.exit(1);
//     }
//   };




