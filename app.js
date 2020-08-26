require('dotenv').config()
const {create} = require('@open-wa/wa-automate');
const express = require('express')
const app = express()
const mqtt_handler = require('./mqtt_handler')
const wa = require('./wa_handler')

app.use(express.json())
const PORT = process.env.PORT;

const start = async (client) => {
  app.use(client.middleware);
  mqtt_handler.init()
  app.listen(PORT, function () {
    console.log(`\n• Listening on port ${PORT}!`);
  });

  client.onMessage((message)=>{
    console.log("ada message dari app");
    wa.msgHandler(client,message)
  })
}

create({
  sessionId: 'session1'
}).then(async client => await start(client))
  .catch(e => {
    console.log('Error', e.message);
  });