const { ObjectId } = require("bson");
const MongoClient = require("mongodb").MongoClient;

const mongoClient = new MongoClient(process.env.DB_CONN_STRING);
const db = mongoClient.db(process.env.DB_NAME);
const collection = db.collection(process.env.DB_COLLECTION);

async function create(params) {
    try {
        await mongoClient.connect();
        await collection.insertOne(params);
    }catch(err) {
        console.log(err);
    }
}

async function search(params) {
    try {
        await mongoClient.connect();
        const results = await collection.find(params).toArray();
        return results
    }catch(err) {
        console.log(err);
    }
}

async function remove(id, email) {
    try {
        await mongoClient.connect();
        await collection.deleteOne({_id:new ObjectId(id), email: email});
    }catch(err) {
        console.log(err);
    }
}

async function update(id, params) {
    try {
        await mongoClient.connect();
        await collection.findOneAndUpdate({_id: new ObjectId(id)}, { $set: params})
    }catch(err) {
        console.log(err);
    }
}

module.exports = {create, search, remove, update}
