import mongoose from "mongoose";

const mongoDbConnectionUri =
  // pro
  process.env.MONGODB_URI
    ? process.env.MONGODB_URI
    : "mongodb://localhost:27017/irms";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoDbConnectionUri);
    console.log(`\n☘️  MongoDB Connected! Db host: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting MongoDB:", error.message);
    throw error;
  }
};

export default connectDB;
