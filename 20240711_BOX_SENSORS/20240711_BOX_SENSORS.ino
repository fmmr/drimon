#include "Adafruit_VL53L0X.h"
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_AHTX0.h>
#include <LCD_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>

#include <BH1750.h>

#define SEALEVELPRESSURE_HPA (1013.25)
#define ONE_WIRE_BUS 23

#define soil1 34
#define soil2 36
#define soil3 39

Adafruit_AHTX0 aht;  // Create an instance of the AHT30 sensor
Adafruit_BME280 bme;
Adafruit_VL53L0X lox = Adafruit_VL53L0X();
Adafruit_SSD1306 display(128, 64, &Wire, -1);
BH1750 lightMeter;  // Create an instance of the BH1750 light sensor
LCD_I2C lcd(0x27, 16, 2);
OneWire oneWire(ONE_WIRE_BUS);

// Pass our oneWire reference to Dallas Temperature.
DallasTemperature sensors(&oneWire);

// arrays to hold device address
DeviceAddress termo1 = { 0x28, 0xAD, 0x1B, 0x46, 0xD4, 0x4D, 0x17, 0x66 };  // closest
DeviceAddress termo2 = { 0x28, 0x0E, 0xE5, 0x6A, 0x00, 0x00, 0x00, 0x8E };  // middle
DeviceAddress termo3 = { 0x28, 0xBE, 0x62, 0x6B, 0x00, 0x00, 0x00, 0x9C };  // farthest

void setup() {
  Serial.begin(115200);

  // wait until serial port opens for native USB devices
  while (!Serial) {
    delay(1);
  }

  if (!lox.begin()) {
    Serial.println(F("Failed to boot VL53L0X"));
    while (1)
      ;
  }
  // power

  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1)
      ;
  }

  if (!lightMeter.begin()) {
    Serial.println("Could not find a valid lightMeter sensor, check wiring!");
    while (1)
      ;
  }


  if (!aht.begin()) {
    Serial.println("Could not find a valid AHT30 sensor, check wiring!");
    while (1)
      ;
  }
  Serial.println("Initializing displays...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    display.setCursor(0, 0);
    display.print("D init fail");
    display.display();
  }

  // Initialize the LCD
  lcd.begin(false);
  lcd.clear();
  lcd.backlight();
  lcd.home();

  Serial.print("Locating devices...");
  sensors.begin();
  Serial.print("Found ");
  Serial.print(sensors.getDeviceCount(), DEC);
  Serial.println(" devices.");

  Serial.print("termo1 Address: ");
  printAddress(termo1);
  Serial.println();

  Serial.print("termo2 Address: ");
  printAddress(termo2);
  Serial.println();

  Serial.println("termo3 Address: ");
  printAddress(termo3);
  Serial.println();
  sensors.setResolution(termo1, 10);
  sensors.setResolution(termo2, 10);
  sensors.setResolution(termo3, 10);
}
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}
void printTemperature(DeviceAddress deviceAddress) {
  // method 1 - slower
  //Serial.print("Temp C: ");
  //Serial.print(sensors.getTempC(deviceAddress));
  //Serial.print(" Temp F: ");
  //Serial.print(sensors.getTempF(deviceAddress)); // Makes a second call to getTempC and then converts to Fahrenheit

  // method 2 - faster
  float tempC = sensors.getTempC(deviceAddress);
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("Error: Could not read temperature data");
    return;
  }
  Serial.println(tempC, 2);
}
void loop() {
  VL53L0X_RangingMeasurementData_t measure;

  Serial.println("Reading a measurement... ");

  lox.rangingTest(&measure, false);  // pass in 'true' to get debug data printout!
  int range = measure.RangeMilliMeter;
  float temp = bme.readTemperature();
  float tempK = 273.15 + temp;
  float pressure = bme.readPressure() / 100.0F;
  float hum = bme.readHumidity();
  float seaLevelPressure = pressure + (12 * 31 / 100.0);
  float alt1 = bme.readAltitude(SEALEVELPRESSURE_HPA);
  float alt2 = bme.readAltitude(seaLevelPressure);
  float lux = lightMeter.readLightLevel();
  sensors_event_t humidity, ahtTemp;
  aht.getEvent(&humidity, &ahtTemp);
  float totalAhtTemp = ahtTemp.temperature;
  float totalHumidity = humidity.relative_humidity;

  if (measure.RangeStatus != 4) {  // phase failures have incorrect data
    Serial.print("Distance (mm): ");
    Serial.println(range);
  } else {
    Serial.println(" out of range ");
  }

  Serial.print("BME Temperature = ");
  Serial.print(temp);
  Serial.println("*C");

  Serial.print("AHT Temperature = ");
  Serial.print(totalAhtTemp);
  Serial.println("*C");

  Serial.print("Pressure = ");
  Serial.print(pressure);
  Serial.println("hPa");

  Serial.print("Approx. Altitude = ");
  Serial.print(alt1);
  Serial.println("m");


  Serial.print("seaLevelPressure = ");
  Serial.print(seaLevelPressure);
  Serial.println("hPa");

  Serial.print("Approx. Altitude 2 = ");
  Serial.print(alt2);
  Serial.println("m");

  Serial.print("BME Humidity = ");
  Serial.print(hum);
  Serial.println("%");

  Serial.print("AHT Humidity = ");
  Serial.print(totalHumidity);
  Serial.println("%");

  Serial.print("Lux = ");
  Serial.println(lux);

  Serial.println();

  Serial.print("Requesting temperatures...");
  sensors.requestTemperatures();  // Send the command to get temperatures
  Serial.println("DONE");

  Serial.print("Temp termo1 C: ");
  printTemperature(termo1);  // Use a simple function to print out the data
  Serial.print("Temp termo2 C: ");
  printTemperature(termo2);  // Use a simple function to print out the data
  Serial.print("Temp termo3 C: ");
  printTemperature(termo3);  // Use a simple function to print out the data

  Serial.println();
  int s1 = analogRead(soil1);
  int s2 = analogRead(soil2);
  int s3 = analogRead(soil3);

  int m1 = map(s1, 2700, 728, 0, 100);
  int m2 = map(s2, 3200, 946, 0, 100);
  int m3 = map(s3, 2800, 728, 0, 100);

  Serial.print("soil1: ");
  Serial.print(s1);
  Serial.print("   ");
  Serial.println(m1);

  Serial.print("soil2: ");
  Serial.print(s2);
  Serial.print("   ");
  Serial.println(m2);

  Serial.print("soil3: ");
  Serial.print(s3);
  Serial.print("   ");
  Serial.println(m3);


  display.clearDisplay();
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("D:");
  display.print(range);


  display.setTextSize(1);
  display.setCursor(0, 18);
  display.print("P:");
  display.print(seaLevelPressure, 2);
  display.setCursor(0, 28);
  display.print("T1:");
  display.print(temp, 2);
  display.setCursor(0, 38);
  display.print("T2:");
  display.print(totalAhtTemp, 2);
  display.setCursor(0, 48);
  display.print("H:");
  display.print(hum, 2);
  display.display();

  lcd.clear();
  lcd.home();
  lcd.print(lux, 0);
  lcd.print("lx ");
  lcd.print(seaLevelPressure,0);
  lcd.print("hPa");

  lcd.setCursor(0, 1);
  lcd.print(temp, 1);
  lcd.print("*C   ");
  lcd.print(range,1);
  lcd.print("mm");

  delay(3000);
}
