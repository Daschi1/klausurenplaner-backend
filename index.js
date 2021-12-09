const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const cors = require('cors');


const http = require("http");
const https = require("https");

const dbName = "klausurenplaner";
const mongoUri = `mongodb+srv://user:password123456@cluster0.pn9b9.mongodb.net/test`;
const collectionName = "klausuren";

const owm_appid = "db61d57b3aa133a380b4fd0aa768a31d";

async function main() {
const app = express();
app.use(cors());
app.use(express.json()); // parsing the request body
let client;


try {
    client = await MongoClient.connect(mongoUri, { useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);



    app.get("/get/klausurs", async (req, res) => {
        try {
            let return_object = {
                "klausurs": []
            };
            const result = await collection.find().toArray();
            return_object.klausurs = result;
            console.log(return_object);
            res.send(return_object);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
            }
    });

    app.get("/get/klausur/:klausurId", async(req, res) => {
        try {
            const id = req.params.klausurId
            console.log(`Received request for klausur ${id}`);
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

                console.log(latitude);
                console.log(longitude);
                console.log(wetter_response);

                for(i=0; i<7; i++){
                    w_date = new Date(wetter_response.daily[i].dt*1000);
                    k_date = new Date(klausur[0].date);
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

    app.get("/get/todos/:klausurId", async (req, res) => {
        try {
            const klausurId = req.params.klausurId;
            let todo_object = {
                "klausurId": klausurId,
                todos: []
            };
            console.log(`Received request for todos in klausur ${klausurId}`);
            let klausur = await collection.find({"klausurId": klausurId}).toArray();

            todo_object.todos = klausur[0].todos;

            console.log(todo_object);
            res.send(todo_object);

        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });


    app.post("/add/klausur", async (req, res) => {
        try {
            let db_object = {
                "klausurId": undefined,
                "name": undefined,
                "date": undefined,
                "plz": undefined,
                "todos": []
            }

            let data = req.body;
            let klausurId = getRandomInt(Number.MAX_SAFE_INTEGER);

            db_object.klausurId = String(klausurId);
            db_object.name = data.name;    
            db_object.date = data.date;     
            db_object.plz = data.plz;       

            const result = await collection.insertOne(db_object);

            if (result.acknowledged == true){
                const id = result.insertedId; // unique Id from MongoDB

                console.log(`Inserted document ${id}`);
                res.status(201).end();
            }
            else {
                console.log("Unable to enter object into database");
                res.status(500).send("Object could not be entered into database.");
            }
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });

    app.post("/add/todo", async (req, res) => {
        try {
            let data = req.body;
            let klausurId = data.klausurId;

            console.log(`Received request to post todo in klausur ${klausurId}`);

            let newTodo = {
                "id": undefined,
                "task": undefined,
                "important": undefined,
                "completed": false
            }

            let todoId = getRandomInt(Number.MAX_SAFE_INTEGER);

            newTodo.id = String(todoId);
            newTodo.task = data.task;
            newTodo.important = data.important;

            let result = await collection.updateOne(
                {"klausurId": "222"},
                {
                $push: {
                    todos: newTodo
                    }
                }
            );

            if(result.acknowledged){
                res.status(200).end();
            }
            else {
                console.log("Unable to enter object into database");
                res.status(500).send("Object could not be entered into database.");}

        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });


    app.put("/update/todo/:id", async (req, res) => {
        try {
            const id = String(req.params.id);
            const todo_completed = req.query.completed === undefined? false:true;
            console.log(id);
            console.log(todo_completed);

            let todo_index = 0;
            let i = 0;
            let klausur = await collection.find({"todos.id": id}).toArray();
            console.log(klausur[0].todos[i].id);

            while(klausur[0].todos[i]!== undefined){
                if(klausur[0].todos[i].id==id){
                    todo_index = i; break;
                }
                else {i+=1;}
            }

            todostring = `todos.${todo_index}.completed`;         
            
             collection.updateOne(
                {"todos.id": id},
                {$set: {[todostring]: todo_completed}}
            );
            
            res.status(200).send();
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });



    app.delete("/delete/klausur/:klausurId", async (req, res) => {
        try {
            let klausurId = req.params.klausurId;
            console.log(`Received request to delete klausur ${klausurId}`);

            result = await collection.deleteOne({"klausurId": klausurId});
            if (result.acknowledged == true){
                res.status(200).end();
            }
            else {
                console.log("Unable to delete object from database");
                res.status(500).send("Object could not be deleted from database.");}

        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });
    

    app.delete("/delete/todo/:todoId", async (req, res) => {
        try {
            const todoId = String(req.params.todoId);
            console.log(`Received request to delete the Todo ${todoId}`);

            let i = 0;
            let klausur = await collection.find({"todos.id": todoId}).toArray();
            let klausurId = klausur[0].klausurId;

            while(klausur[0].todos[i]!== undefined){
                if(klausur[0].todos[i].id==todoId){
                    todo_index = i; break;
                }
                else {i+=1;}
            }

            del_todo = klausur[0].todos[i];

            todostring = `todos.${todo_index}.completed`;
            
            result = await collection.updateOne(
                {"klausurId": klausurId},
                {$pull: {"todos": del_todo}}
            );

            if (result.acknowledged){
                res.status(200).end();
            }
            else {
                console.log("Unable to delete object from database");
                res.status(500).send("Object could not be deleted from database.");}


        
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });


    app.listen(3001, () => {
    console.log("Listening on http://localhost:3001");
    });



} catch (err) {
console.error(err);
}
}
main().catch((err) => console.err(err));




geo_function = function(plz, callback){
    const geo_url = `http://api.openweathermap.org/geo/1.0/zip?zip=${plz},de&limit=1&appid=${owm_appid}`;

    http.get(geo_url, res => {
        let geo_response = '';
        res.on('data', chunk => {
          geo_response += chunk;
          geo_response_json = JSON.parse(geo_response);
        });

        res.on('end', () => {
            const latitude = geo_response_json.lat;
            const longitude = geo_response_json.lon;
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

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
