import httpServer from "./app.js";
import connectDB from "./db.js";

const startServer = () => {
  httpServer.listen(process.env.PORT || 8080, () => {
    console.log(`⚙️  Server is  running on port : ${process.env.PORT || 8080}\n`);
  });
};

try {
  await connectDB();
  startServer();
} catch (error) {
  console.log("Mongo db connect error: ", err);
}
