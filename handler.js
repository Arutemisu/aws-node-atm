const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const ATM_TABLE = process.env.ATM_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

//Lat and Long min and max numbers
const LATMIN = -90;
const LATMAX = 90;
const LONGMIN = -180;
const LONGMAX = 180;

//Check if a number is in range
const range = (x, min, max) => {
  return x >= min && x <= max;
}

const itemValidation = (provider, geometry, address) => {
  let errorMessage=true;
  if (typeof provider !== "string") {
    errorMessage = { error: '"provider" must be a string' };
  }
  if (typeof address !== "string") {
    errorMessage = { error: '"address" must be a string' }; //TODO make sure address and geometry array are same location
  }
  //Check whether geometry array is valid (we mostly care about that)
  if (typeof geometry !=="object" || geometry["type"] === undefined || geometry["coordinates"] === undefined) {
    errorMessage = { error: '"geometry" must be an object and have type and coordinates fields' };
  }
  if (typeof geometry.type !== "string" || geometry.type !== 'Point') {
    errorMessage = { error: '"geometry" Type field should be a string and type "Point" only'};
  }
  if (typeof geometry.coordinates[0] !== "number" || !range(geometry.coordinates[0], LATMIN, LATMAX)) {
    errorMessage = { error: '"geometry" Latitude field should be a number and in the range of ' + LATMIN + ' and ' + LATMAX};
  }
  if (typeof geometry.coordinates[1] !== "number" || !range(geometry.coordinates[1], LONGMIN, LONGMAX)) {
    errorMessage = { error: '"geometry" Longitude field should be a number and in the range of ' + LONGMIN + ' and ' + LONGMAX};
  }
  return errorMessage;
}

app.use(express.json());

app.get("/atm", async function (req, res) {
  const params = {
    TableName: ATM_TABLE,
    //LastEvaluatedKey: req.query.LastEvaluatedKey
  };

  try {
    const Items = await dynamoDbClient.scan(params).promise(); //This returns only 1MB of data, if we want to query more, we will have to add LastEvaluatedKey to our query
    if (Items) {
      res.json(Items.Items/*, LastEvaluatedKey */);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find atms' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive atm list" });
  }
});

app.post("/atm", async function (req, res) {
  const { provider, geometry, address } = req.body;
  //Make sure we got all of our data is correct
  let dataValidated = itemValidation(provider, geometry, address);
  if (typeof dataValidated === "object") {
    return res.status(400).json(dataValidated);
  }
  //Need to create Id
  //As we dont know the current count of the items in Dynamo and we dont want to waste a call, we want to make sure the id we choose doesn't already exist
  //The solution: use timestamp, in case we might encounter concurrent calls to the DB my suggestion is to use GUID and not a number
  let id = Date.now(); 

  const params = {
    TableName: ATM_TABLE,
    Item: {
      id: id,
      geometry: geometry,
      address: address,
      provider: provider
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json(params.Item);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not create atm location" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
