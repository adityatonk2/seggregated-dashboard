import { MongoClient } from "mongodb";

const options = {};

declare global {
  // allow global var reuse in dev

  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri, options).connect();
}

let clientPromise: Promise<MongoClient> | undefined;

// Deferred: the MongoClient is only created (and MONGODB_URI only required)
// the first time a route actually needs the connection, not at import time.
// This keeps `next build` from failing when collecting page data for API
// routes in environments where MONGODB_URI isn't set at build time.
export default function getMongoClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  return clientPromise;
}
