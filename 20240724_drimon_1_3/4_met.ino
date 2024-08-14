#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

WiFiClientSecure *secureClient = new WiFiClientSecure;
const char* metUrl = "https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231";

void fetchMet(SensorData& data) {
  if (secureClient) {
    secureClient->setInsecure();
    //create an HTTPClient instance
    HTTPClient https;

    //Initializing an HTTPS communication using the secure client
    Serial.println("  [met.no] begin ...");
    if (https.begin(*secureClient, metUrl)) {  // HTTPS
      https.setTimeout(3);  // hm - this does not work very well....  soem say it1s in second - but can ONLY be set AFTER connecting - so....
      https.addHeader("User-Agent", "drimon: https://drimon.rodland.no/");
      // start connection and send HTTP header
      Serial.println("  [met.no] GET ...");
      int httpCode = https.GET();
      // httpCode will be negative on error
      if (httpCode > 0) {
        Serial.printf("  [met.no] ... %d\n", httpCode);
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String payload = https.getString();
          DynamicJsonDocument doc(2048);
          deserializeJson(doc, payload);
          JsonArray jsonArray = doc["properties"]["timeseries"];
          data.metTemp = jsonArray[0]["data"]["instant"]["details"]["air_temperature"].as<float>();
          data.metHumidity = jsonArray[0]["data"]["instant"]["details"]["relative_humidity"].as<float>();
          data.tempDiff = data.temperature - data.metTemp;
          data.humidityDiff = data.humidity - data.metHumidity;
          FETCHED_MET = true;
        }
      }
      else {
        Serial.printf("  [met.no] FAILED ... %s\n", https.errorToString(httpCode).c_str());
        flashLED(RED_LED_PIN, 6);
      }
      https.end();
    }
  }
  else {
    Serial.println("  [met.no] Unable to connect");
    flashLED(RED_LED_PIN, 5);
  }
}
