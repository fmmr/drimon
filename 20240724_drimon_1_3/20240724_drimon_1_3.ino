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


#define FLASH_WIFI_CONNECT_FAILURE 2
#define FLASH_DISPLAY_INIT_FAILURE 3

#define SEALEVELPRESSURE_HPA 1013.25
#define WIFI_MAX_RETRIES 3
#define NUM_READINGS 2
#define SLEEP_BETWEEN_READINGS 12
#define HEIGHT_ABOVE_SEE_LEVEL 31
#define DISPLAY_TIME 3000
#define ONE_WIRE_BUS 23

int dispLine = 0;
boolean SHOULD_POST = false;

Adafruit_VL53L0X tof = Adafruit_VL53L0X();
Adafruit_SSD1306 display(128, 64, &Wire, -1);
LCD_I2C lcd(0x27, 16, 2);
Adafruit_BME280 bme;
BH1750 lightMeter;
Adafruit_AHTX0 aht;
DFRobot_MAX17043 batteryMonitor;
DeviceAddress termo1 = { 0x28, 0xAD, 0x1B, 0x46, 0xD4, 0x4D, 0x17, 0x66 };  // closest
DeviceAddress termo2 = { 0x28, 0x0E, 0xE5, 0x6A, 0x00, 0x00, 0x00, 0x8E };  // middle
DeviceAddress termo3 = { 0x28, 0xBE, 0x62, 0x6B, 0x00, 0x00, 0x00, 0x9C };  // farthest
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
VL53L0X_RangingMeasurementData_t tofData;

// WiFiClient client;

void dispPrint(String msg) {
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

void testLeds() {  // TODO no need for this
  flashLED(GREEN_LED_PIN, 2);
  flashLED(BLUE_LED_PIN, 2);
  flashLED(RED_LED_PIN, 2);
}

// TODO - do not post til thingspeak if button is pressed
// TODO - do not display/power on display if wakeup from timer  (can we turn off lcd backlight)


void setup() {
  long start = millis();
  setupPins();
  Serial.begin(115200);
  Serial.println("Setup...");

  initDisplays();

  // Setting SHOULD_POST to correct value
  fixShouldPost();

  // TODO we only need wifi if we are to log data
  connectToWiFi();

  initSensors();

  // TODO no need for this
  testLeds();
  delay(500);

  // TODO when finished setup? beep(50);
  Serial.println("Setup: done");

  Serial.println("Measuring...");
  dispPrint("Measuring...");
  SensorData data = measure(start);
  Serial.println("Measuring: done");

  Serial.println("Displaying data...");
  displayData(data);
  Serial.println("Displaying data: done");

  delay(DISPLAY_TIME);
  //calibrate_soil();  // TODO remove
  digitalWrite(SENSOR_POWER_PIN, LOW);
}

void loop() {  // do nothing
}
