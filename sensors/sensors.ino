// wiring:

// 1. HC-SR04 ultrasonic sensor
//    trigger: 11
//    echo: 12

// 2. i2c: SLA/SLC. (oled,  BH1750 light intensity sensor, DHT20 temp/hum)

// 3. LM393 soil moisture: A0

// 4. LEDS hygro: green 6, yellow/red: 5)

#include "DHT20.h"
#include <Wire.h>
#include <math.h>
#include "SSD1306Ascii.h"
#include "SSD1306AsciiWire.h"

// #define SCREEN_WIDTH 128  // OLED display width, in pixels
// #define SCREEN_HEIGHT 64  // OLED display height, in pixels
#define I2C_ADDRESS 0x3C
SSD1306AsciiWire oled;
int BH1750address = 0x23;  //setting i2c address

const int HYGRO_PIN = A0;  // select the input pin for the potentiometer
DHT20 DHT;
byte luxBuffer[2];


void setup() {
  Serial.begin(115200);
  Serial.println(__FILE__);
  Wire.begin();

  oled.begin(&Adafruit128x64, I2C_ADDRESS);
  DHT.begin();
  oled.setFont(System5x7);
  oled.setLetterSpacing(1);
  oled.clear();
  oled.println("Humidity air :");
  oled.println("Temperature  :");
  oled.println("Humidity soil:");
  oled.println("Distance     :");
  oled.println("Light        :");

  pinMode(11, OUTPUT);  // hygro trigger
  pinMode(12, INPUT);   // hygro echo
  pinMode(5, OUTPUT);   // led
  pinMode(6, OUTPUT);   // led
  flashLeds(80);
}


void loop() {
  if (millis() - DHT.lastRead() >= 1000) {
    uint32_t start = micros();
    float temp;
    float hum;
    uint32_t time;
    int status;
    bool printHeader = false;
    int hygro = hygroRead();
    uint16_t lux = luxRead();
    float distance = ultrasonic();
    readDHT20(&hum, &temp, &time, &status);
    display(hum, temp, hygro, lux, distance);
    serialPrint(hum, temp, hygro, lux, start, status);
  }
}

int hygroRead() {
  int hygro = analogRead(HYGRO_PIN);
  if (hygro < 900) {
    digitalWrite(6, HIGH);
    digitalWrite(5, LOW);
  } else {
    digitalWrite(5, HIGH);
    digitalWrite(6, LOW);
  }
  return hygro;
}

uint16_t luxRead() {
  BH1750_Init();
  delay(100);
  if (2 == BH1750_Read()) {
    return ((luxBuffer[0] << 8) | luxBuffer[1]) / 1.2;
  }
  return -1;
}

int BH1750_Read()  //
{
  int i = 0;
  Wire.beginTransmission(BH1750address);
  Wire.requestFrom(BH1750address, 2);
  while (Wire.available())  //
  {
    luxBuffer[i] = Wire.read();  // receive one byte
    i++;
  }
  Wire.endTransmission();
  return i;
}

void BH1750_Init() {
  Wire.beginTransmission(BH1750address);
  Wire.write(0x10);  //1lx reolution 120ms
  Wire.endTransmission();
}

float ultrasonic() {
  digitalWrite(11, LOW);
  delayMicroseconds(2);
  digitalWrite(11, HIGH);
  delayMicroseconds(10);
  digitalWrite(11, LOW);
  long duration = pulseIn(12, HIGH);
  return duration * 0.034 / 2;
}


void display(float hum, float temp, int hygro, uint16_t lux, float distance) {
  oled.setCursor(88, 0);
  oled.print(hum);
  oled.clearToEOL();
  oled.setCursor(88, 1);
  oled.print(temp);
  oled.clearToEOL();
  oled.setCursor(88, 2);
  oled.print(hygro);
  oled.clearToEOL();
  oled.setCursor(88, 3);
  oled.print(distance);
  oled.setCursor(88, 4);
  oled.print(lux);
  oled.clearToEOL();
}


void readDHT20(float *hum, float *temp, uint32_t *time, int *status) {
  uint32_t start = micros();
  *status = DHT.read();
  *time = micros() - start;
  *hum = DHT.getHumidity();
  *temp = DHT.getTemperature();
}

uint8_t count = 0;
void serialPrint(float hum, float temp, int hygro, uint16_t lux, uint32_t start, int status) {
  if ((count % 10) == 0) {
    count = 0;
    Serial.println();
    Serial.println("Humidity (%)\tTemp (°C)\tHygro (A)\tLight (lx)\tTime (µs)\tStatus");
  }
  count++;

  //  DISPLAY DATA, sensor has only one decimal.
  Serial.print(hum, 1);
  Serial.print("\t\t");
  Serial.print(temp, 1);
  Serial.print("\t\t");
  Serial.print(hygro);
  Serial.print("\t\t");
  Serial.print(lux);
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

void flashLeds() {
  for (int i = 0; i <= 3; i++) {
    Serial.println(i);
    digitalWrite(5, HIGH);
    digitalWrite(6, HIGH);
    delay(80);
    digitalWrite(5, LOW);
    digitalWrite(6, LOW);
    delay(80);
  }
}
