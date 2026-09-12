import { MongoClient, type Document } from "mongodb"

const uri = process.env.MONGODB_URI
const options = {}

if (!uri) {
  throw new Error(
    "Missing MONGODB_URI — add it to .env.local. See the comments there for the verified connection string.",
  )
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = new MongoClient(uri, options).connect()
}

export default clientPromise

const dbName = process.env.MONGODB_DB ?? "blog"

export async function getCollection<T extends Document>(name: "blogs") {
  const client = await clientPromise
  return client.db(dbName).collection<T>(name)
}