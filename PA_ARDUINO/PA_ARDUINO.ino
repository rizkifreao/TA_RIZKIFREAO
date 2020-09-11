/**************************************************************
  /*
   Arduino GPS SIM 808 MQTT

   SIM808 SIRKUIT KE ARDUINO
   3.4v ->  +OUT (STEPDOWN)
   GND  ->  -OUT (STEPDOWN)
   GND  ->  GND (ARDUINO)
   TXD  ->  10
   RXD  ->  11



 **************************************************************/

#define TINY_GSM_MODEM_SIM808
#define PIN_PWR_MODEM 9

#define SerialMon Serial
#include <SoftwareSerial.h>
SoftwareSerial SerialAT(10, 11); // RX, TX

// Define the serial console for debug prints, if needed
#define TINY_GSM_DEBUG SerialMon

// Range to attempt to autobaud
#define GSM_AUTOBAUD_MIN 9600
#define GSM_AUTOBAUD_MAX 115200

// Define how you're planning to connect to the internet
#define TINY_GSM_USE_GPRS true
#define TINY_GSM_USE_WIFI false

// set GSM PIN, if any
#define GSM_PIN ""

// Your GPRS credentials, if any
const char apn[]  = "";                      // Sesuaikan apn untuk GPRS yang digunakan
const char gprsUser[] = "";
const char gprsPass[] = "";

// MQTT details
const char* broker = "157.230.35.21";           // Sesuaikan dengan alamat IP broker


const char* topicInit = "GsmClientTest/init";
const char* topicGetLokasi = "whatsapp/out/lokasi";
const char* topicGetMesin = "whatsapp/out/mesin";
const char* topicGetKunci = "whatsapp/out/kunci";
const char* topicGetStatus = "whatsapp/out/status";
const char* topicReport = "whatsapp/in";
const char* topicNotifikasi = "whatsapp/notifikasi";

/*start gps*/
const char* deviceID = "device001";
const char* topicNdoware = "ndoware";             // Sesuaikan dengan topik yang dituju

#define DEBUG false
//char type[32], no1[32], no2[32], date[32], lat[32], lon[32];
char dataGPS[48];
long lastGetGPStAttempt = 0;
/*end gps*/

#include <TinyGsmClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

//char data[80];
//StaticJsonBuffer<200> jsonBuffer;
StaticJsonDocument<250> wrapper;

#ifdef DUMP_AT_COMMANDS
#include <StreamDebugger.h>
StreamDebugger debugger(SerialAT, SerialMon);
TinyGsm modem(debugger);
#else
TinyGsm modem(SerialAT);
#endif
TinyGsmClient client(modem);
PubSubClient mqtt(client);

#define RELAY_PIN1 7 //TERHUBUNG MESIN
#define RELAY_PIN2 6
#define RELAY_PIN3 5
#define RELAY_PIN4 4

#define SENSV_PIN1 A0
#define SENSV_PIN2 A1

#define PIN_SENS_GETAR 8


float SENS1_OUT = 0.0; //Battery
float SENS1_IN = 0.0;
unsigned int SENS1_VAL = 0;
bool SENS1_STAT = true;

int sens_getar_val = 0;

int status_kunci = 0;
int status_relay = 1;

bool kirim_notifGetar = true;

float SENS2_OUT = 0.0; //Kunci Kontak
float SENS2_IN = 0.0;
unsigned int SENS2_VAL = 0;
bool SENS2_STAT = true;

float R1 = 30000.0;
float R2 = 7500.0;

int relay1Status = HIGH;
int relay2Status = HIGH;
int relay3Status = HIGH;
int relay4Status = HIGH;

long lastReconnectAttempt = 0;
long waktuAkhirSensorV = 0;

void mqttCallback(char* topic, byte* payload, int len) {

  SerialMon.print(F("Message arrived ["));
  SerialMon.print(topic);
  SerialMon.print(F("]: "));
  SerialMon.write(payload, len);
  SerialMon.println();

//  char buffer[256];

  //  const size_t capacity = JSON_OBJECT_SIZE(0) + JSON_OBJECT_SIZE(4) + 90;
  //  StaticJsonDocument<capacity> doc;
  //  deserializeJson(doc, payload, len);
  //  char buffer[256];
  //
  //  Serial.println(doc["from"].as<char*>());
  //  Serial.println(doc["cmd"].as<char*>());
  //  Serial.println(doc["deviceID"].as<char*>());

  //  if(doc["perintah"] == "lokasi"){
  //     Serial.println("BATAS");
  //  }
  //  Serial.println("BATAS");

  if (strcmp(topic, topicGetLokasi) == 0) {
    Serial.println(F("KIRIM LOKASI"));
    mqtt.publish((char*)"whatsapp/in/lokasi", dataGPS);

  } else if (strcmp(topic, topicGetMesin) == 0) {
    relay1Status = !relay1Status;
    digitalWrite(RELAY_PIN1, relay1Status);
    mqtt.publish("whatsapp/in/mesin", relay1Status ? "0" : "1");

  } else if (strcmp(topic, topicGetKunci) == 0) {
    status_kunci = !status_kunci;
    if(status_kunci == 0){
      SENS1_STAT = true;
      SENS2_STAT = true;
      kirim_notifGetar = true;
      digitalWrite(RELAY_PIN1, HIGH);
      relay1Status = HIGH;
    }
//    digitalWrite(RELAY_PIN1, relay1Status);
    //    Serial.println(status_kunci);
    mqtt.publish("whatsapp/in/kunci", status_kunci?"1":"0");
  }
//  else if (strcmp(topic, topicGetStatus) == 0) {
//    uint8_t chargeState = -99;
//    int8_t percent = -99;
//    uint16_t milliVolts = -9999;
//    modem.getBattStats(chargeState, percent, milliVolts);
//    char cpercent[4];
//    char sens[8];
//    dtostrf(SENS1_OUT, 6, 2, sens);
//    char stat_info[250];
//    strcpy(stat_info, deviceID);
//    strcat(stat_info, ",");
//    strcat(stat_info, status_kunci);
//    strcat(stat_info, ",");
//    strcat(stat_info, relay1Status);
//    strcat(stat_info, ",");
//    strcat(stat_info, itoa(percent, cpercent, 10));
//    mqtt.publish("whatsapp/in/status", stat_info);
//  }

//  if (strcmp(topic, "coba") == 0) {
//
//    //    StaticJsonDocument<200> res;
//
//    //
//    //    wrapper["lat"] = lat;
//    //    wrapper["lng"] = lon;
//    //    wrapper["spd"] = String("20");
//    //    size_t n = serializeJson(wrapper, buffer);
//    //    //    char payload[c + 2];  //+2 ? not sure about that
//    //    //    serializeJson(res, payload);
//    //    mqtt.publish("Cobian/weh", buffer, n);
//    //    getSendGPS();
//    //      relay1Status = !relay1Status;
//    //      digitalWrite(RELAY_PIN11, relay1Status);
//    //    mqtt.publish("coba/aja", "COBAIN");
//  }
}

boolean mqttConnect() {
  SerialMon.print(F("==== MENHUBUNGKAN KE BROKER "));
  SerialMon.print(broker);
  SerialMon.print(F(" ===="));

  // Connect to MQTT Broker
  boolean status = mqtt.connect(deviceID);

  // Or, if you want to authenticate MQTT:
  //  boolean status = mqtt.connect("GsmClientName", "user", "pass");       // isi dengan user pass MQTT

  if (status == false) {
    SerialMon.println(F(" --GAGAL--"));
    return false;
  }

  SerialMon.println(F(" ++BERHASIL++"));

  //  mqtt.publish(topicInit, strcat(deviceID, " Connected"));
  //  mqtt.publish(topicInit, deviceID + (const char*)" Connected" );
  mqtt.subscribe(topicGetLokasi);
  mqtt.subscribe(topicGetMesin);
  mqtt.subscribe(topicGetKunci);
  mqtt.subscribe(topicGetStatus);
  mqtt.subscribe("coba");
  return mqtt.connected();
}

void readSensorV1() {
  SENS1_VAL = analogRead(SENSV_PIN1);
  SENS1_OUT = (SENS1_VAL * 5.0) / 1024.0;
  SENS1_IN = SENS1_OUT / (R2 / (R1 + R2));
}

void readSensorV2() {
  SENS2_VAL = analogRead(SENSV_PIN2);
  SENS2_OUT = (SENS2_VAL * 5.0) / 1024.0;
  SENS2_IN = SENS2_OUT / (R2 / (R1 + R2));
}


void getSendGPS() {
  Serial.println(F("------ get gps ------"));

  String gps_raw = modem.getGPSraw();
  Serial.print("GPS raw data:"); Serial.println(gps_raw);
  // GPS raw data: 1,1,20200204092314.000,-6.317693,107.017000,61.000,0.02,316.5,1,,1.0,1.8,1.5,,13,11,,,46,,

  char no1[32], no2[32], date[32], lat[32], lon[32], spd[12];
  //    , alt[12], spd[12];
  char* buf = gps_raw.c_str();
  strcpy(no1, strtok(buf , ","));
  strcpy(no2 , strtok(NULL, ","));
  strcpy(date , strtok(NULL, ","));
  strcpy(lat, strtok(NULL, ","));
  strcpy(lon, strtok(NULL, ","));
  strcpy(spd, strtok(NULL, ","));

  Serial.print(F("Date/Time: ")); Serial.println(date);
  Serial.print(F("Latitude : ")); Serial.println(lat);
  Serial.print(F("Longitude: ")); Serial.println(lon);

  uint8_t chargeState = -99;
  int8_t percent = -99;
  uint16_t milliVolts = -9999;
  modem.getBattStats(chargeState, percent, milliVolts);
  char cpercent[4];

  strcpy(dataGPS, deviceID);
  strcat(dataGPS, ",");
  strcat(dataGPS, lat);
  strcat(dataGPS, ",");
  strcat(dataGPS, lon);
  strcat(dataGPS, ",");
  strcat(dataGPS, itoa(percent, cpercent, 10));

  Serial.println(dataGPS);
//  mqtt.publish("coba/aja", dataGPS);
}

void setup() {
  // Set console baud rate
  SerialMon.begin(38400);
  delay(10);

  pinMode(RELAY_PIN1, OUTPUT);
  pinMode(RELAY_PIN2, OUTPUT);
  pinMode(RELAY_PIN3, OUTPUT);
  pinMode(RELAY_PIN4, OUTPUT);

  digitalWrite(RELAY_PIN1, relay1Status);
  digitalWrite(RELAY_PIN2, relay2Status);
  digitalWrite(RELAY_PIN3, relay3Status);
  digitalWrite(RELAY_PIN4, relay4Status);

  // !!!!!!!!!!!
  // Set your reset, enable, power pins here
  // !!!!!!!!!!!
  SerialMon.println(">>> MENYALAKAN MODEM...");
  pinMode(PIN_PWR_MODEM, OUTPUT);
  digitalWrite(PIN_PWR_MODEM, HIGH);
  delay(1000);
  digitalWrite(PIN_PWR_MODEM, LOW);
  delay(3000);

  SerialMon.println(F(">>> TUNGGU....."));

  // TinyGsmAutoBaud(SerialAT,GSM_AUTOBAUD_MIN,GSM_AUTOBAUD_MAX);
  SerialAT.begin(9600);
  delay(3000);

  SerialMon.println(F(">>> INISIALISASI MODEM....."));
  modem.restart();
  //  modem.init();

  String modemInfo = modem.getModemInfo();
  SerialMon.print(F("- Modem Info: "));
  SerialMon.println(modemInfo);

#if TINY_GSM_USE_GPRS
  // Membuka pin kartu SIM jika ada
  if ( GSM_PIN && modem.getSimStatus() != 3 ) {
    modem.simUnlock(GSM_PIN);
  }
#endif

  SerialMon.print(F(">>> MENUNGGU JARINGAN...."));
  if (!modem.waitForNetwork()) {
    SerialMon.println(F(" GAGAL"));
    delay(10000);
    return;
  }
  SerialMon.println(F(" BERHASIL"));

  if (modem.isNetworkConnected()) {
    SerialMon.println(F("+++ JARINGAN TERHUBUNG +++"));
  }

#if TINY_GSM_USE_GPRS
  // Mengatur koneksi GPRS setelah registrasi jaringan
  SerialMon.print(F(">>> MENGUBUNGKAN APN"));
  SerialMon.print(apn);
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    SerialMon.println(F(" --- APN GAGAL ---"));
    delay(10000);
    return;
  }
  SerialMon.println(F(" +++ APN BERHASIL +++"));

  if (modem.isGprsConnected()) {
    SerialMon.println(F("+++ GPRS TERHUBUNG +++"));
  }
#endif

  // Pengaturan Broker MQTT
  mqtt.setServer(broker, 1883);
  mqtt.setCallback(mqttCallback);

  Serial.println(F(">>> MENGAKTIFKAN GPS....."));
  modem.enableGPS();
}

void loop() {

  if (!mqtt.connected()) {
    SerialMon.println(F("=== GAGAL TERHUBUNG KE BROKER ==="));
    // Hubungkan lagi setiap 10 detik
    unsigned long t = millis();
    if (t - lastReconnectAttempt > 10000L) {
      lastReconnectAttempt = t;
      if (mqttConnect()) {
        lastReconnectAttempt = 0;
      }
    }
    delay(100);
    return;
  }

  readSensorV1();
  readSensorV2();

  //   GPS data every 60 secons
  unsigned long t = millis();
  if (t - lastGetGPStAttempt > 60000L) {
    lastGetGPStAttempt = t;
    getSendGPS();
  }

  if (status_kunci == 1) {

    digitalWrite(RELAY_PIN1, 0);
    relay1Status = LOW;
   
    //    ==================  NOTIFIKASI SENSOR 1 (KUNCI KONTAK) =====================
    if (SENS1_VAL == 0) {
      if (SENS1_STAT) {
//        Serial.println(F("SENSOR 1 DICABUT"));
        mqtt.publish("whatsapp/notifikasi", "aki");
        SENS1_STAT = !SENS1_STAT;
      }
    }

    //   ===================== NOTIFIKASI SENSOR 2 (KUNCI KONTAK) ======================
    if (SENS2_VAL > 0) {
      if (SENS2_STAT) {
//        Serial.println(F("KUNCI KONTAK MENYALA"));
        mqtt.publish("whatsapp/notifikasi", "kunci_kontak");
        SENS2_STAT = !SENS2_STAT;
      }
    }

    //   ===================== NOTIFIKASI SENSOR GETAR (KUNCI KONTAK) ======================
    sens_getar_val = digitalRead(PIN_SENS_GETAR);
    if (sens_getar_val == 1) {
      if (kirim_notifGetar) {
//        Serial.println(F("ADA GETARAN"));
        mqtt.publish("whatsapp/notifikasi", "getar");
        kirim_notifGetar = !kirim_notifGetar;
      }
    }
  }

  //  if (t - waktuAkhirSensorV > 1000L) {
  //    waktuAkhirSensorV = t;
  //    Serial.print(F("Sensor V1 VAL : ")); Serial.println(SENS1_VAL);
  //    Serial.print(F("Sensor V1 IN : ")); Serial.println(SENS1_IN);
  //    Serial.print(F("Sensor V1 OUT : ")); Serial.println(SENS1_OUT);
  //    Serial.println(F("============================================"));
  //    Serial.print(F("Sensor V2 VAL : ")); Serial.println(SENS2_VAL);
  //    Serial.print(F("Sensor V2 IN : ")); Serial.println(SENS2_IN);
  //    Serial.print(F("Sensor V2 OUT : ")); Serial.println(SENS2_OUT);
  //  }

  mqtt.loop();
}
