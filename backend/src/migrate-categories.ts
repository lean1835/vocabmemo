import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/vocabmemo";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection is not active");
    }

    const vocabulariesCollection = db.collection("vocabularies");
    const cachesCollection = db.collection("vocab_caches");

    console.log("Updating vocabularies collection...");
    const vocabResult = await vocabulariesCollection.updateMany(
      { category: { $in: ["Daily English", "General English", "General"] } },
      { $set: { category: "Vocabulary" } }
    );
    console.log(`Updated ${vocabResult.modifiedCount} documents in vocabularies.`);

    console.log("Updating vocab_caches collection...");
    const cacheResult = await cachesCollection.updateMany(
      { category: { $in: ["Daily English", "General English", "General"] } },
      { $set: { category: "Vocabulary" } }
    );
    console.log(`Updated ${cacheResult.modifiedCount} documents in vocab_caches.`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
