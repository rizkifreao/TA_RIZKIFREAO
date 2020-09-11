require('dotenv').config()
const logger = require('./log_handler')
const {json} = require('body-parser')

var Mqtt_Controller = module.exports;

Mqtt_Controller.publish = (client ,topic, msg) => {
  client.publish(topic, msg.toString(), {
    qos: 2
  }, (err) => {
    if (err) logger.error('mqtt-publish', JSON.stringify(err))
    else logger.info('mqtt-publish', 'message published to ' + topic)
  })
}

Mqtt_Controller.sendPublish = async (client ,topic, msg) => {
  client.publish(topic, msg.toString(), {
    qos: 2
  }, (err) => {
    if (err) {logger.error('mqtt-publish', JSON.stringify(err))}
    else {
      client.on("message",(topicIn,payloadIn)=>{
        if (payloadIn.perintah == msg.perintah) {
          // console.log("ada pesan balik");
          return true;
        }
        
      })
      // logger.info('mqtt-publish', 'message published to ' + topic)
    }
  })
}

Mqtt_Controller.subscribe = (client,topic) => {
  client.subscribe(topic, {
    qos: 0
  }, (err) => {
    if (err) logger.error('mqtt-subscribe', JSON.stringify(err))
    else logger.info('mqtt-subscribe', 'success subscribe to ' + topic)
  })
}


Mqtt_Controller.callback = async (topic, message, whatsapp) => {
  var payload = JSON.parse(message)
  
  switch (payload.perintah) {
    // example
    // {"from":"6283101194384@c.us","perintah":"status","value":{"lat":"-6","lng":"100","loc":"Bandung"}}
    case "lokasi":
      var value = payload.value
      var callback = "*==== SUKSES ====*\n\n"+
      "\`\`\`Latitude : "+value.lat+"\`\`\`\n"+
      "\`\`\`Laogtitude : "+ value.lng + "\`\`\`\n"

      await whatsapp.sendText(payload.from,callback)
      await whatsapp.sendLocation(payload.from,value.lat,value.lng,"asdasdasdasdasdsadsad")
    break;

    case "mesin":
       // {"from":"6283101194384@c.us","perintah":"mesin","value":{"relay":"0"}}
      var value = payload.value
      var callback = ""

      if (value.relay == "0") {
        callback = "*==== SUKSES ====*\n\n" +
          "\`\`\`Kelistrikan mesin berhasil di aktifkan\`\`\`\n"+
          "\`\`\`Status : 1\`\`\`"
      }else{
        callback = "*==== SUKSES ====*\n\n" +
          "\`\`\`Kelistrikan mesin berhasil di nonaktifkan\`\`\`\n"+
          "\`\`\`Status : 0\`\`\`"
      }

      await whatsapp.sendText(payload.from, callback)
    break;

    case "kunci":
      // {"from":"6283101194384@c.us","perintah":"kunci","value":{"kunci":"1"}}
      var value = payload.value
      var callback = ""

      if (value.kunci == "1") {
        callback = "*==== SUKSES ====*\n\n" +
          "\`\`\`Sistem keamanan berhasil di aktifkan\`\`\`\n"+
          "\`\`\`Status : 1\`\`\`"
      } else {
        callback = "*==== SUKSES ====*\n\n" +
          "\`\`\`Kelistrikan mesin berhasil di nonaktifkan\`\`\`\n"+
          "\`\`\`Status : 0\`\`\`"
      }

      await whatsapp.sendText(payload.from, callback)
    break;

    case "status":
    // {"from":"6283101194384@c.us","perintah":"status","value":{"kunci":"1","mesin":"1","lat":"1","lng":"1","batt":"1"}}
    var value = payload.value
    var callback = callback = "*Status Informasi*\n\n" +
      "\`\`\`Keamanan : 1\`\`\`\n" +
      "\`\`\`Mesin : 1\`\`\`\n" +
      "\`\`\`Latitude : 1\`\`\`\n" +
      "\`\`\`Longtitude : 1\`\`\`\n" +
      "\`\`\`Batterai : 1\`\`\`\n" +
      "\`\`\`http://maps.google.com/maps?q=lat,long\`\`\`"

    await whatsapp.sendText(payload.from, callback)
    break;
  }
  console.log(payload);
}