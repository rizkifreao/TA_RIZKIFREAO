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
  var msg = message.toString();
  var payload = {
    from: "6289664652474@c.us"
  }

  switch (topic) {
    // example
    // {"from":"6289664652474@c.us","perintah":"status","value":{"lat":"-6","lng":"100","loc":"Bandung"}}
    case "whatsapp/in/lokasi":
      var value = msg.split(",")
      var callback = "*==== SUKSES ====*\n\n"+
      "\`\`\`Latitude : "+value[1]+"\`\`\`\n"+
      "\`\`\`Laogtitude : "+ value[2] + "\`\`\`\n"

      await whatsapp.sendText("6289664652474@c.us", callback)
      await whatsapp.sendLocation("6289664652474@c.us", value[1], value[2], "")
    break;

    case "whatsapp/in/mesin":
       // {"from":"6289664652474@c.us","perintah":"mesin","value":{"relay":"0"}}
      var callback = ""

      if (msg == "0") {
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

    case "whatsapp/in/kunci":
      // {"from":"6289664652474@c.us","perintah":"kunci","value":{"kunci":"1"}}
      var callback = ""

      if (msg == "1") {
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

    case "whatsapp/in/status":
      // {"from":"6289664652474@c.us","perintah":"status","value":{"kunci":"1","mesin":"1","lat":"1","lng":"1","batt":"1"}}
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

  if (topic == "whatsapp/notifikasi") {
    var callback = ""
    // if (msg == "aki") {
    //   callback = "*==== PERINGATAN ====*\n\n"+
    //   "\`\`\`Sensor mendeteksi bahwa aki baterai telah dilepas, Segera periksa kendaraan anda\`\`\`"
    // } else 
    if (msg == "kunci_kontak"){
      callback = "*==== PERINGATAN ====*\n\n" +
        "\`\`\`Sensor mendeteksi kunci kontak dinyalakan, Segera periksa kendaraan anda\`\`\`"  
          setTimeout(function () {
            console.log("HAHA");
            whatsapp.sendText(payload.from, callback)
            // break;
          }, 5000);
        
    } else if (msg == "getar"){
      callback = "*==== PERINGATAN ====*\n\n" +
        "\`\`\`Sensor mendeteksi adanya gerakan pada kendaraan anda, Segera periksa kendaraan anda\`\`\`"
        await whatsapp.sendText(payload.from, callback)

    }
  }
  console.log(msg);
}