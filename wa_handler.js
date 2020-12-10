const {json} = require('body-parser')
const moment = require('moment')
const logger = require('./log_handler')
const mqttController = require('./mqtt_controller')
const chatHeller = require('./helper/chat_helper')

WA_Controller = module.exports
const Model = require('./models/index')

WA_Controller.msgHandler = async (whatsapp, message, mqttClient) => {

  try {
    const {type, body, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg} = message
    const {id, pushname} = sender
    const {name} = chat
    const time = moment(t * 1000).format('DD/MM HH:mm:ss')
    const commands = ['/bantuan','/lokasi', '/daftarperangkat','/mesin','/kunci','/status']
    const cmds = commands.map(x => x + '\\b').join('|')
    const cmd = type === 'chat' ? body.match(new RegExp(cmds, 'gi')) : type === 'image' && caption ? caption.match(new RegExp(cmds, 'gi')) : ''
    
    if (cmd) {
    // if (cmd && !isGroupMsg) {
      if (!isGroupMsg) console.log('[EXEC]', color(time, 'yellow'), color(cmd[0]), 'from', color(pushname))
      if (isGroupMsg) console.log('[EXEC]', color(time, 'yellow'), color(cmd[0]), 'from', color(pushname), 'in', color(name))
      const args = body.trim().split(' ')
      switch (cmd[0]) {
        case '/bantuan':
          var respon = "*List Perintah*\n\n" +
            "*/daftarperangkat,[nomor_perangkat],[plat_nomor]*\n"+
            "\`\`\`digunakan untuk mendaftarkan perangkat anda dengan nomor whatsapp whatsapp anda untuk mendapatkan notifikasi atau menggunakan perintah lainya\`\`\`\n" +
            "_contoh penggunaan : */daftarperangkat,123456,D 5443 AB*_\n\n" +
            "*/lokasi* :\n"+
            "\`\`\`Melihat informasi lokasi kendaraan anda\`\`\`\n\n" +
            "*/kunci,[0/1]* :\n"+
            "\`\`\`Kunci kendararaan anda secara sistem. Parameter hanya dapat berisi nilai 0 (nonaktif) atau 1 (aktif)\`\`\`\n" +
            "_contoh penggunaan : */kunci,1*_\n\n"+
            "*/mesin,[0/1] :\n"+
            "\`\`\`Aktifkan atau nonaktifkan sistim pengapian sepeda motor anda. Parameter dapat berisi angka 0 (nonaktif) atau 1 (aktif)\`\`\`\n" +
            "_contoh penggunaan : */mesin,1*_\n\n" +
            "*/status*\n" +
            "\`\`\`Melihat status informasi perangkat keamanan anda.\`\`\`\n\n" +
            "*/bantuan*\n" +
            "\`\`\`Melihat daftar perintah yang disediakan dan cara penggunaannya\`\`\`\n";

          await whatsapp.sendText(from, respon)
          break;

        case '/daftarperangkat':
            var no_perangkat = body.split(',')[1]
            var plat_nomor = body.split(',')[2]

            await Model.Users.findOrCreate({
                where: {
                  nomor_wa: from
                },
                defaults: {
                  no_perangkat: no_perangkat,
                  nomor_wa: from,
                  plat_nomor: plat_nomor
                }
              }).then(user => {
                  if (user[1] == true) {
                    var callback = "*===== Sukses =====*\n\n" +
                      "\`\`\`Berhasil menyimpan data\`\`\`"

                    whatsapp.sendText(from, callback)
                  } else {
                    var callback = "*===== Gagal !!! =====*\n\n" +
                      "\`\`\`Nomor anda sudah digunakan, gunakan nomor lain !!\`\`\`"

                    whatsapp.sendText(from, callback)
                  }
              }).catch(e => {
                var res = JSON.parse(JSON.stringify(e.errors[0]))
                if (res.path == 'no_perangkat') {
                  var callback = "*===== Gagal !!! =====*\n\n" +
                    "\`\`\`Perangkat sudah terdaftar, silahkan hubungi admin\`\`\`"

                    whatsapp.sendText(from,callback)
                }else{
                  var callback = "*===== Sistem Error !!! =====*\n\n" +
                    "\`\`\`Sistem sedang mengalami error, silahkan hubungi admin\`\`\`"

                  whatsapp.sendText(from, callback)
                }
              })
          break;
          
        case '/lokasi':
 
            var pengguna = await cek_nomor(from)
            if (!pengguna){
              var callback = "*===== Gagal !!! =====*\n\n\`\`\`Nomor anda belum terdaftar, silahkan mendaftar terlebih dahulu. Gunakan fitur /bantuan untuk melihat daftar perintah\`\`\`"
              whatsapp.sendText(from, callback)
              break;
            }

            var payload = JSON.stringify({
              from : from,
              perintah : "lokasi",
              deviceID : pengguna.no_perangkat,
              value : {

              }
            })
            console.log(payload.toString());

            mqttController.publish(mqttClient, "whatsapp/out/lokasi", "lokasi")
          break;

        case '/kunci':
            var kunci = body.split(",")[1]
            var pengguna = cek_nomor(from)
            if (!pengguna) {
              var callback = "*===== Gagal !!! =====*\n\n\`\`\`Nomor anda belum terdaftar, silahkan mendaftar terlebih dahulu. Gunakan fitur /bantuan untuk melihat daftar perintah\`\`\`"
              whatsapp.sendText(from, callback)
              break;
            }
            
            var payload = JSON.stringify({
              from: from,
              perintah: "kunci",
              deviceID: pengguna.no_perangkat,
              value: {
                kunci : kunci
              }
            })

            mqttController.publish(mqttClient, "whatsapp/out/kunci", kunci)
          break;

        case '/mesin':
            var mesin = body.split(",")[1]
            var pengguna = cek_nomor(from)
            if (!pengguna) {
              var callback = "*===== Gagal !!! =====*\n\n\`\`\`Nomor anda belum terdaftar, silahkan mendaftar terlebih dahulu. Gunakan fitur /bantuan untuk melihat daftar perintah\`\`\`"
              whatsapp.sendText(from, callback)
              break;
            }

            var payload = JSON.stringify({
              from: from,
              perintah: "mesin",
              deviceID: pengguna.no_perangkat,
              value: mesin        
            })

            mqttController.publish(mqttClient, "whatsapp/out/mesin", mesin)
          break;

        case '/status':

            var pengguna = cek_nomor(from)
            if (!pengguna) {
              var callback = "*===== Gagal !!! =====*\n\n\`\`\`Nomor anda belum terdaftar, silahkan mendaftar terlebih dahulu. Gunakan fitur /bantuan untuk melihat daftar perintah\`\`\`"
              whatsapp.sendText(from, callback)
              break;
            }

            mqttController.callback('whatsapp/in/status',"",whatsapp)

            var payload = JSON.stringify({
              from: from,
              perintah: "status",
              deviceID: pengguna.no_perangkat,
              value: {}
            })

            // mqttController.publish(mqttClient, "whatsapp/out/status", payload)
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

WA_Controller.mqttHandler = async (topic,whatsapp) =>{

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

async function cek_nomor(from) {
  const nomor_wa = Model.Users.findOne({where:{nomor_wa : from}})  
  if (nomor_wa === null) {
    return false
  }else{
    return nomor_wa
  }
}