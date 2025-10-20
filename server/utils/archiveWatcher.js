import mongoose from "mongoose";

export const startArchiveWatcher = () => {
  try {
    const db = mongoose.connection;

    // Watch changes in the "requests" collection
    const changeStream = db.collection("requests").watch(
      [{ $match: { operationType: "delete" } }],
      { fullDocument: "updateLookup" } // requires pre-image enabled
    );

    changeStream.on("change", async (change) => {
      try {
        const deletedDoc = change.fullDocument;
        if (deletedDoc) {
          await db.collection("requests_archive").insertOne(deletedDoc);
          console.log("Archived deleted request:", deletedDoc._id);
        }
      } catch (err) {
        console.error("Error archiving deleted request:", err);
      }
    });

    console.log("✅ Archive watcher started for Request deletions");
  } catch (error) {
    console.error("Failed to start archive watcher:", error);
  }
};
