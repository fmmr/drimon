// wiring:

// 1. HC-SR04 ultrasonic sensor
//    trigger: 11
//    echo: 12

// 2. i2c: SLA/SLC. (oled,  BH1750 light intensity sensor, DHT20 temp/hum)

// 3. LM393 soil moisture: A0

// 4. LEDS hygro: green 6, red: 5)

// 5. LEDS distance: green 10, yellow: 9, red: 7

#include "DHT20.h"
#include <Wire.h>
#include <math.h>
#include "SSD1306Ascii.h"
#include "SSD1306AsciiWire.h"

// Misc constants
const int LOOP_DELAY = 1000;  // will not probe unless millis has passed since last probe
const byte INIT_FLASH_DELAY = 70;  // delay used in init-flashing
const byte PRINT_HEADER_EVERY = 15;  // serial output emits a header every PRINT_HEADER_EVERY lines.

// Pins and i2c addresses
const uint8_t OLED_I2C = 0x3C;
const int BH1750_I2C = 0x23;  //setting i2c address
const int HYGRO_PIN = A0;     // select the input pin for the potentiometer
const uint8_t ULTRA_TRIGGER_PIN = 11;
const uint8_t ULTRA_ECHO_PIN = 12;
const uint8_t GREEN_PIN = 6;
const uint8_t ORANGE_PIN = 5;
const uint8_t OLED_VALUES_COL = 88;
const uint8_t NEAR_PIN = 10; 
const uint8_t MEDIUM_PIN = 9;
const uint8_t FAR_PIN = 7;

// Variables
uint8_t headerCountSerial = 0;
DHT20 DHT;
SSD1306AsciiWire oled;

void setup() {
  Serial.begin(115200);
  Serial.println(__FILE__);
  Wire.begin();

  DHT.begin();

  oled.begin(&Adafruit128x64, OLED_I2C);
  initOled();

  pinMode(ULTRA_TRIGGER_PIN, OUTPUT);  // ultrasonic trigger
  pinMode(ULTRA_ECHO_PIN, INPUT);      // ultrasonic echo
  pinMode(ORANGE_PIN, OUTPUT);         // led
  pinMode(GREEN_PIN, OUTPUT);          // led
  pinMode(NEAR_PIN, OUTPUT);           // led
  pinMode(MEDIUM_PIN, OUTPUT);         // led
  pinMode(FAR_PIN, OUTPUT);            // led

  flashLeds(INIT_FLASH_DELAY);
}


void loop() {
  if (shouldTrigger()) {
    uint32_t start = micros();
    float temp;
    float hum;
    int status;
    bool printHeader = false;
    int hygro = hygroRead();
    int lux = luxRead();
    float distance = ultrasonic();
    readDHT20(&hum, &temp, &status);
    display(hum, temp, hygro, lux, distance);
    serialPrint(hum, temp, hygro, lux, start, status, distance);
  }
  delay(20);
}

bool shouldTrigger() {
  return millis() - DHT.lastRead() >= LOOP_DELAY;
}

int hygroRead() {
  int hygro = analogRead(HYGRO_PIN);

  int maxRealMeasuredValue = 1023;  // when dipped in real dry soil - typically 550 - debug by uncommenting serial line below.
  // Serial.println(hygro);

  // magic mapping from: https://pijaeducation.com/arduino/sensor/soil-sensor-with-arduino-in-analog-mode/
  hygro = map(hygro, 0, 1023, 10, maxRealMeasuredValue);
  hygro = map(hygro, maxRealMeasuredValue, 10, 0, 100);
  if (hygro > 50) {
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(ORANGE_PIN, LOW);
  } else {
    digitalWrite(ORANGE_PIN, HIGH);
    digitalWrite(GREEN_PIN, LOW);
  }
  return hygro;
}

int luxRead() {
  Wire.beginTransmission(BH1750_I2C);
  Wire.write(0x10);  //1lx reolution 120ms
  Wire.endTransmission();
  delay(100);

  byte luxBuffer[2];
  int i = 0;
  Wire.beginTransmission(BH1750_I2C);
  Wire.requestFrom(BH1750_I2C, 2);
  while (Wire.available())  //
  {
    luxBuffer[i] = Wire.read();  // receive one byte
    i++;
  }
  Wire.endTransmission();

  if (2 == i) {
    return ((luxBuffer[0] << 8) | luxBuffer[1]) / 1.2;
  }
  return -1;
}



float ultrasonic() {
  digitalWrite(ULTRA_TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRA_TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRA_TRIGGER_PIN, LOW);
  long duration = pulseIn(ULTRA_ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2;
  if (distance < 7) {
    digitalWrite(NEAR_PIN, HIGH);
    digitalWrite(MEDIUM_PIN, LOW);
    digitalWrite(FAR_PIN, LOW);
  } else if (distance < 20) {
    digitalWrite(NEAR_PIN, LOW);
    digitalWrite(MEDIUM_PIN, HIGH);
    digitalWrite(FAR_PIN, LOW);
  } else {
    digitalWrite(NEAR_PIN, LOW);
    digitalWrite(MEDIUM_PIN, LOW);
    digitalWrite(FAR_PIN, HIGH);
  }
  return distance;
}

void readDHT20(float *hum, float *temp, int *status) {
  *status = DHT.read();
  *hum = DHT.getHumidity();
  *temp = DHT.getTemperature();
}

void display(float hum, float temp, int hygro, int lux, float distance) {
  byte i = 0;
  oled.setCursor(OLED_VALUES_COL, i++);
  oled.print(hum);
  oled.clearToEOL();
  oled.setCursor(OLED_VALUES_COL, i++);
  oled.print(temp);
  oled.clearToEOL();
  oled.setCursor(OLED_VALUES_COL, i++);
  oled.print(hygro);
  oled.clearToEOL();
  oled.setCursor(OLED_VALUES_COL, i++);
  oled.print(distance);
  oled.clearToEOL();
  oled.setCursor(OLED_VALUES_COL, i++);
  oled.print(lux);
  oled.clearToEOL();
}

void initOled() {
  oled.setFont(System5x7);
  oled.setLetterSpacing(1);
  oled.clear();
  oled.println("Humidity air :");
  oled.println("Temperature  :");
  oled.println("Humidity soil:");
  oled.println("Distance     :");
  oled.println("Light        :");
  oled.println();
  oled.println();
  oled.println("       FMR 2024");
}

void serialPrint(float hum, float temp, int hygro, int lux, uint32_t start, int status, float distance) {
  if ((headerCountSerial % PRINT_HEADER_EVERY) == 0) {
    headerCountSerial = 0;
    Serial.println();
    Serial.println("Humidity (%)\tTemp (°C)\tHygro (A)\tLight (lx)\tDistance\tTime (µs)\tStatus DHT20");
  }
  headerCountSerial++;

  //  DISPLAY DATA, sensor has only one decimal.
  Serial.print(hum, 1);
  Serial.print("\t\t");
  Serial.print(temp, 1);
  Serial.print("\t\t");
  Serial.print(hygro);
  Serial.print("\t\t");
  Serial.print(lux);
  Serial.print("\t\t");
  Serial.print(distance);
  Serial.print("\t\t");
  Serial.print(micros() - start);
  Serial.print("\t\t");
  switch (status) {
    case DHT20_OK:
      Serial.print("OK");
      break;
    case DHT20_ERROR_CHECKSUM:
      Serial.print("Checksum error");
      break;
    case DHT20_ERROR_CONNECT:
      Serial.print("Connect error");
      break;
    case DHT20_MISSING_BYTES:
      Serial.print("Missing bytes");
      break;
    case DHT20_ERROR_BYTES_ALL_ZERO:
      Serial.print("All bytes read zero");
      break;
    case DHT20_ERROR_READ_TIMEOUT:
      Serial.print("Read time out");
      break;
    case DHT20_ERROR_LASTREAD:
      Serial.print("Error read too fast");
      break;
    default:
      Serial.print("Unknown error");
      break;
  }
  Serial.print("\n");
}

void flashLeds(int del) {
  for (int i = 0; i < 3; i++) {
    digitalWrite(NEAR_PIN + i, HIGH);
    digitalWrite(ORANGE_PIN, HIGH);
    digitalWrite(GREEN_PIN, HIGH);
    delay(del);
    digitalWrite(NEAR_PIN + i, LOW);
    digitalWrite(ORANGE_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    delay(del);
  }
}
