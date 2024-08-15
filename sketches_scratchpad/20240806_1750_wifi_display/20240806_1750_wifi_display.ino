#include <Wire.h>/private/var/folders/73/674vrw3d5072ycpl63swq_kr0000gp/T/.arduinoIDE-unsaved202476-3773-1qe7vx7.rpuv/BH1750autoadjust/BH1750autoadjust.ino
#include <BH1750.h>
#include <WiFi.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include <secrets.h>

#define WIFI_MAX_RETRIES 10

BH1750 lightMeter2(0x5C);  // changed from 0x23
BH1750 lightMeter2_int(0x23);  // changed from 0x23
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void connectToWiFi() {
  int retries = 0;
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("  Initializing WiFi...");
  delay(2000);

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(1000);
    Serial.print(".");
    retries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("    WiFi: OK");
    Serial.print(", IP: ");
    Serial.print(WiFi.localIP());
    Serial.print(", RSSI: ");
    Serial.println(WiFi.RSSI());

  } else {
    Serial.println("    WiFi: FAILED");
  }
  Serial.println("  Wifi Initialized");
}


void setup() {
  Serial.begin(115200);
  connectToWiFi();
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
  } else {
    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
    Serial.println("    SSD1306 Initialized");
    display.display();

  }
  lightMeter2.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x5C);
  lightMeter2_int.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23);
}

void loop() {
  display.clearDisplay();
  int8_t rssi = WiFi.RSSI();
  Serial.print("RSSI: ");
  Serial.print(rssi);
  Serial.println(" dBm");
  display.setCursor(0, 0);
    display.print("r: ");
  display.println(rssi);
  if (lightMeter2.measurementReady()) {
    float lux = lightMeter2.readLightLevel();
    display.setCursor(0, 17);
    display.print("l1: ");
    display.println(lux, 1);
    Serial.print("Lightn 1: ");
    Serial.print(lux);
    Serial.println(" lx");
  }
  if (lightMeter2_int.measurementReady()) {
    float lux = lightMeter2_int.readLightLevel();
    display.setCursor(0, 34);
    display.print("l2: ");
    display.println(lux, 1);
    Serial.print("Light 2: ");
    Serial.print(lux);
    Serial.println(" lx");
  }


    display.display();
    delay(3000);
}
