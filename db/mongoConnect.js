const mongoose = require('mongoose');
const {config} = require("../config/secret");


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(config.MONGO_DB);
  console.log("mongo connect chat");
}