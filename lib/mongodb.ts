import { MongoClient } from "mongodb";

const options = {};

declare global {
  // allow global var reuse in dev

  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(uri: string): Promise<MongoClient> {
  const promise = new MongoClient(uri, options).connect();
  // If the connection attempt fails, drop every cache pointing at this
  // rejected promise so the next call retries instead of awaiting the same
  // dead promise forever (previously a single Atlas blip would permanently
  // break the app until the dev server was restarted).
  promise.catch(() => {
    if (clientPromise === promise) clientPromise = undefined;
    if (global._mongoClientPromise === promise) global._mongoClientPromise = undefined;
  });
  return promise;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connect(uri);
    }
    return global._mongoClientPromise;
  }

  return connect(uri);
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
