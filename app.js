require('dotenv').config()
const {create} = require('@open-wa/wa-automate');
const express = require('express')
const app = express()
const mqtt = require('mqtt')
const logger = require('./log_handler')

const mqtt_controller = require('./mqtt_controller')
const wa = require('./wa_handler')

const serverOption = {
  headless: true,
  qrTimeout: 40,
  authTimeout: 40,
  autoRefresh: true,
  qrRefreshS: 15,
  devtools: false,
  cacheEnabled: false,
  chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}

const opsys = process.platform;
if (opsys == "win32" || opsys == "win64") {
  serverOption['executablePath'] = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
} else if (opsys == "linux") {
  serverOption['browserRevision'] = '737027';
} else if (opsys == "darwin") {
  serverOption['executablePath'] = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

const mqttSubId = 'MQTT_WA_SERVER';

const mqttOptions = {
  keepalive: 60,
  clientId: mqttSubId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: false,
  retain: false,
  reconnectPeriod: 1000 * 3,
  connectTimeout: 1000 * 30,
  will: {
    topic: 'outTopic',
    payload: 'Koneksi Whatsapp Server Ditutup secara tidak normal..!',
    qos: 1,
    retain: false
  }
};

const mqttClient = mqtt.connect(process.env.MQTT_URL, mqttOptions)

app.use(express.json())
const PORT = process.env.PORT;

const start = async (client) => {
  app.use(client.middleware);

  // WEB SERVER
  app.listen(PORT, function () {
    console.log(`\n• Listening on port ${PORT}!`);
  });

  // ============= MQTTT =================
  mqttClient.on('connect', (res) => {
    console.log("MQTT INIT");
    // mqttClient.subscribe('GsmClientTest/init', function (err) {
    //   if (!err) {
    //     mqttClient.publish('GsmClientTest/init', 'Hello mqtt')
    //     logger.info('mqtt-init', 'MQTT connected')
    //   }
    // })
  })

  mqtt_controller.subscribe(mqttClient, "Notifikasi")
  mqtt_controller.subscribe(mqttClient, "whatsapp/in")


  // mqtt_controller.subscribe(mqttClient, "Notifikasi")

  // HANDLE MESSAGE DARI MQTT
    // mqttClient.on("message",mqtt_controller.callback)
  mqttClient.on('message', (topic, payload) => {
    
    mqtt_controller.callback(topic, payload, client)
    

    // if (topic == "Notifikasi") {
    //   var msg = JSON.parse(payload)
    //   console.log(msg.hello);
    //   client.sendText("6283101194384@c.us", "NOTIFIKASI");
    // }

    logger.info('mqtt-message', JSON.stringify({
      topic: topic,
      payload: payload.toString()
    }))
  })

  // HANDLE MESSAGE DARI WHATSAPP
  client.onMessage((message) => {
    wa.msgHandler(client, message, mqttClient)
  })
}

app.get('/',(req,res)=>{
  res.send("<h1> Selamat datang di Whatsapp MQTT Api ... </h1>")
})

create(serverOption).then(async client => await start(client))
  .catch(e => {
    console.log('Error', e.message);
  });