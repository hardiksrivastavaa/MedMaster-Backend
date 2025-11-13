// import mongoose from 'mongoose';

// const connectDB = async () => {
//   try {
//     // Attempt to connect to MongoDB using the URI from the .env file
//     const conn = await mongoose.connect(process.env.MONGO_URI);

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     // Exit process with failure
//     process.exit(1);
//   }
// };

// export default connectDB;


// config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  if (global._mongoConn && mongoose.connection.readyState === 1) return mongoose;
  if (!global._mongoConn) {
    global._mongoConn = mongoose.connect(process.env.MONGO_URI, { /* opts */ });
  }
  return global._mongoConn;
};

export default connectDB;

