const {json} = require('body-parser')
const moment = require('moment')
const mqttClient = require('./mqtt_handler')


const msgHandler = async (client,message) => {
  try {
    const {type, body, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg} = message
    const {id, pushname} = sender
    const {name} = chat
    const time = moment(t * 1000).format('DD/MM HH:mm:ss')
    const commands = ['/help', '/hallo']
    const cmds = commands.map(x => x + '\\b').join('|')
    const cmd = type === 'chat' ? body.match(new RegExp(cmds, 'gi')) : type === 'image' && caption ? caption.match(new RegExp(cmds, 'gi')) : ''
    
    if (cmd) {
      if (!isGroupMsg) console.log('[EXEC]', color(time, 'yellow'), color(cmd[0]), 'from', color(pushname))
      if (isGroupMsg) console.log('[EXEC]', color(time, 'yellow'), color(cmd[0]), 'from', color(pushname), 'in', color(name))
      const args = body.trim().split(' ')
      switch (cmd[0]) {
        case '/help':
          var message = `\`\`\`
            *List Perintah*\n
            \n
            */daftarperangkat[nomor_serial][plat_nomor]* : digunakan untuk mendaftarkan perangkat anda dengan nomor whatsapp
              anda untuk mendapatkan notifikasi atau fitur lainya, contoh penggunaan : _/daftarperangkat,123456,D 5443 AB_\n
            */lokasi* :\n
            */matikankendaraan* :\n
            */status* :\n
				*/kuncikendaraan* :
				\`\`\`
          `
          await client.sendText(from, 'Hai')
          break;
      }
    }else{
      if (!isGroupMsg) console.log(color('[RECV]'), color(time, 'yellow'), 'Message from', color(pushname))
      if (isGroupMsg) console.log(color('[RECV]'), color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
    }
    
  } catch (err) {
    console.log(err);
  }
}

function color(text, color) {
  switch (color) {
    case 'red':
      return '\x1b[31m' + text + '\x1b[0m'
    case 'yellow':
      return '\x1b[33m' + text + '\x1b[0m'
    default:
      return '\x1b[32m' + text + '\x1b[0m' // default is green
  }
}

module.exports = {
  msgHandler
}