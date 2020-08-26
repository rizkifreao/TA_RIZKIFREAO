require('dotenv').config()
const {create} = require('@open-wa/wa-automate');
const express = require('express')
const app = express()
const mqtt_handler = require('./mqtt_handler')
const wa = require('./wa_handler')

const serverOption = {
  headless: true,
  qrTimeout: 40,
  authTimeout: 40,
  autoRefresh: true,
  qrRefreshS: 15,
  devtools: false,
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

app.get('/',(req,res)=>{
  res.send("<h1> Selamat datang di Whatsapp MQTT Api ... </h1>")
})

create(serverOption).then(async client => await start(client))
  .catch(e => {
    console.log('Error', e.message);
  });