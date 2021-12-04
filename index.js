const express = require("express");
const MongoClient = require("mongodb").MongoClient;


const http = require("http");
const https = require("https");

const dbName = "klausurenplaner";
const mongoUri = `mongodb+srv://user:password123456@cluster0.pn9b9.mongodb.net/test`;
const collectionName = "klausuren";

const owm_appid = "db61d57b3aa133a380b4fd0aa768a31d";

async function main() {
const app = express();
app.use(express.json()); // parsing the request body
let client;


try {
    client = await MongoClient.connect(mongoUri, { useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);



    app.get("/getKlausurs", async (req, res) => {
        try {
            const result = await collection.find().toArray();
            console.log(result);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
            }
    });

    app.get("/getKlausur(:klausurId)", async(req, res) => {
        try {
            const id = req.params.klausurId
            id_string = `${id}`;
            klausur = await collection.find({"klausurId": id_string}).toArray();
            postleitzahl = klausur[0].plz;

            geo_function(postleitzahl, (latitude, longitude) => {
                wetter_function(latitude, longitude, wetter_response => {
                
                klausur[0].weather.main = wetter_response.current.weather[0].main;
                klausur[0].weather.degrees = wetter_response.current.temp;
                //CAVE, AKTUELLE Wetterdaten an Klasurort
                //Todo: Zeitabgleich und Vergabe zukünftiger Wetterdaten/Errormeldung
                res.send(klausur[0]);
            });
            });

        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });

    app.get("/klausuren/:klausurId", async (req, res) => {
        try {
            const id = req.params.klausurId;
            console.log(`Received request for klausur ${id}`);
            // TODO
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });
    
    app.get("/getTodos(:klausurId)", async (req, res) => {
        //TODO
    });
    
    app.get("/getTodo(:klausurId, :id)", async (req, res) => {
        //TODO
    });


    app.post("/addKlausur(:klausur)", async (req, res) => {
        try {
            const data = req.body;
            const result = await collection.insertOne(data);
            const id = result.insertedId; // unique Id from MongoDB

            console.log(`Inserted document ${id}`);
            res.set("Location", `/items/${id}`);
            res.status(201).end();
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });
    
    app.post("addTodo(:todo)", async (req, res) => {
        //TODO
    });

    app.put("/updateTodo(:id,:completed)", async (req, res) => {
    // TODO
    });

    app.delete("/deleteKlausur(:klausurId)", async (req, res) => {
    // TODO
    });
    
    app.delete("/deleteTodo(:id)", async (req, res) => {
    // TODO
    });

    app.listen(3000, () => {
    console.log("Listening on http://localhost:3000");
    });



} catch (err) {
console.error(err);
}
}
main().catch((err) => console.err(err));










geo_function = function(plz, callback){
    const geo_url = `http://api.openweathermap.org/geo/1.0/direct?q=${plz},de&limit=1&appid=${owm_appid}`;

    http.get(geo_url, res => {
        let geo_response = '';
        res.on('data', chunk => {
          geo_response += chunk;
          geo_response_json = JSON.parse(geo_response);
          //console.log("Latitude ", geo_response_json[0].lat);
          //console.log("Longitude ", geo_response_json[0].lon);
        });

        res.on('end', () => {
            const latitude = geo_response_json[0].lat;
            const longitude = geo_response_json[0].lon;
            callback(latitude, longitude);
        })
        
      }).on('error', err => {
        console.log(err.message);
      });

}




wetter_function = function(lat, long, callback){
    
    let latitude = lat;
    let longitude = long;

    const weather_url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=metric&lang=de&appid=${owm_appid}`;

    https.get(weather_url, res => {
        let weather_response = '';
        res.on('data', chunk => {
          weather_response += chunk;
          weather_response = JSON.parse(weather_response);
        });

        res.on('end', () => {
          callback(weather_response);
        })
        
      }).on('error', err => {
        console.log(err.message);
      });     
}
