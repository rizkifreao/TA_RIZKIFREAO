require('dotenv').config()
const mqtt = require('mqtt')
const logger = require('./log_handler')
const {json} = require('body-parser')

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

const mqttClient = mqtt.connect(process.env.MQTT_URL,mqttOptions)

const init = () => {
  mqttClient.on('connect', (res) => {
    mqttClient.subscribe('presence', function (err) {
      if (!err) {
        mqttClient.publish('presence', 'Hello mqtt')
        logger.info('mqtt-init', 'MQTT connected')
      }
    })
  })
}

const publish = (topic, msg) => {
  mqttClient.publish(topic, msg.toString(), {
    qos: 0
  }, (err) => {
    if (err) logger.error('mqtt-publish', JSON.stringify(err))
    else logger.info('mqtt-publish', 'message published to ' + topic)
  })
}

const subscribe = (topic) => {
  mqttClient.subscribe(topic, {
    qos: 0
  }, (err) => {
    if (err) logger.error('mqtt-subscribe', JSON.stringify(err))
    else logger.info('mqtt-subscribe', 'success subscribe to ' + topic)
  })
}


mqttClient.on('message', (topic, message) => {

  logger.info('mqtt-message', JSON.stringify({
    topic: topic,
    payload: message.toString()
  }))
})

module.exports = {
  init,
  publish,
  subscribe
}