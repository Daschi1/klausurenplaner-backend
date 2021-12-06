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



    app.get("/klausurs", async (req, res) => {
        try {
            const result = await collection.find().toArray();
            console.log(result);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
            }
    });

    app.get("/klausur(:klausurId)", async(req, res) => {
        try {
            const id = req.params.klausurId
            let id_string = `${id}`;
            let klausur = await collection.find({"klausurId": id_string}).toArray();
            let postleitzahl = klausur[0].plz;

            let output_obj = {
                "klausurId": undefined,
                "name": undefined,
                "date": undefined,
                "plz": undefined,
                "weather": {
                    "main": undefined,
                    "degrees": undefined
                }
            };

            geo_function(postleitzahl, (latitude, longitude) => {
                wetter_function(latitude, longitude, wetter_response => {
                

                output_obj.klausurId = klausur[0].klausurId;
                output_obj.name = klausur[0].name;
                output_obj.date = klausur[0].date;
                output_obj.plz = klausur[0].plz;

                for(i=0; i<7; i++){
                    w_date = new Date(wetter_response.daily[i].dt*1000);
                    k_date = new Date(klausur[0].date*1000);
                    if(w_date.getYear()==k_date.getYear() && w_date.getMonth()==k_date.getMonth() && w_date.getDate()==k_date.getDate()){
                        output_obj.weather.main = wetter_response.daily[i].weather[0].main;
                        output_obj.weather.degrees = wetter_response.daily[i].temp.day;
                        console.log("Day Match found");
                        break;
                    }
                }
            

                res.send(output_obj);
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


    app.post("/items", async (req, res) => {
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

    app.put("/items/:itemId", (req, res) => {
    // TODO
    });

    app.delete("/items/:itemId", (req, res) => {
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
