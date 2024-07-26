#include <Adafruit_AHTX0.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_VL53L0X.h>
#include <BH1750.h>
#include <DFRobot_MAX17043.h>
#include <LCD_I2C.h>
#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>

#include <secrets.h>
#include <sensordata.h>

// secrets are located in secrets.h
// #define WIFI_SSID "xxx"
// #define WIFI_PASSWORD "xxx"

#define BUTTON_PIN 15
#define GREEN_LED_PIN 2
#define RED_LED_PIN 4
#define BLUE_LED_PIN 16
#define BUZZZER_PIN 32
#define SENSOR_POWER_PIN 13
#define POST_SWITCH_PIN 27
#define SOIL_1_PIN 34
#define SOIL_2_PIN 39
#define SOIL_3_PIN 36
#define ONE_WIRE_PIN 23


#define FLASH_WIFI_CONNECT_FAILURE 2
#define FLASH_DISPLAY_INIT_FAILURE 3

#define SEALEVELPRESSURE_HPA 1013.25
#define WIFI_MAX_RETRIES 3
#define NUM_READINGS 2
#define NUM_DISTANCE_READINGS 10
#define SLEEP_BETWEEN_READINGS 12
#define HEIGHT_ABOVE_SEE_LEVEL 31

#define DISPLAY_TIME 12000

#define NIGHT_LEVEL 2
#define DUSK_LEVEL 700
#define SHADE_LEVEL 6000
#define SLEEP_DURATION_DUSK 300
#define SLEEP_DURATION_DAY 300
#define SLEEP_DURATION_NIGHT 500

int dispLine = 0;
boolean SHOULD_POST = false;
bool DISPLAY_ON = false;
boolean TOF_OK = false;

Adafruit_SSD1306 display(128, 64, &Wire, -1);
LCD_I2C lcd(0x27, 16, 2);
Adafruit_VL53L0X tof = Adafruit_VL53L0X();
Adafruit_BME280 bme;
BH1750 lightMeter;
Adafruit_AHTX0 aht;
DFRobot_MAX17043 batteryMonitor;
DeviceAddress termo1 = { 0x28, 0xAD, 0x1B, 0x46, 0xD4, 0x4D, 0x17, 0x66 };  // closest
DeviceAddress termo2 = { 0x28, 0x0E, 0xE5, 0x6A, 0x00, 0x00, 0x00, 0x8E };  // middle
DeviceAddress termo3 = { 0x28, 0xBE, 0x62, 0x6B, 0x00, 0x00, 0x00, 0x9C };  // farthest
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);


void dispPrint(String msg) {
  if (DISPLAY_ON) {
    display.setCursor(0, dispLine);
    display.print("                     ");
    display.setCursor(0, dispLine);
    display.print(msg);
    display.display();
    if (dispLine < 50) {
      dispLine += 9;
    } else {
      dispLine = 0;
    }
  }
}

void beep(int del = 100) {
  digitalWrite(BUZZZER_PIN, HIGH);
  delay(del);
  digitalWrite(BUZZZER_PIN, LOW);
  delay(del);
}

void flashLED(int pin, int times, int delayTime = 180) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delayTime);
    digitalWrite(pin, LOW);
    delay(delayTime);
  }
}

void setup() {
  long start = millis();
  setupPins();
  // beep(50);
  flashLED(GREEN_LED_PIN, 2);
  Serial.begin(115200);

  Serial.println("Setup...");
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0) {
    Serial.println("  Woke up from deep sleep by button press");
    DISPLAY_ON = true;
  } else if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
    SHOULD_POST = digitalRead(POST_SWITCH_PIN) == LOW;
    Serial.println("  Woke up from deep sleep by timer");
  } else {
    Serial.println("  Starting fresh");
    DISPLAY_ON = true;
  }

  initDisplays();

  if (SHOULD_POST) {
    Serial.println("  Will POST");
    dispPrint("Will POST");
    connectToWiFi();
  } else {
    Serial.println("  Will NOT post");
    dispPrint("Will NOT POST");
  }

  initSensors();

  Serial.println("Setup: done");

  delay(200);

  Serial.println("Measuring...");
  dispPrint("Measuring...");
  SensorData data = measure(start);
  Serial.println("Measuring: done");
  dispPrint("Done!");

  Serial.println("Displaying data...");
  displayData(data);
  Serial.println("Displaying data: done");
  if (DISPLAY_ON) {
    delay(DISPLAY_TIME);
  }
  if (SHOULD_POST) {
    postThingSpeak(data);
  }

  int sleepDuration = getSleepDuration(data.lux);
  enterDeepSleep(sleepDuration);
}

void loop() {  // do nothing
}
