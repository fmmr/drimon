#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <LCD_I2C.h>
#include <secrets.h>
// secrets are located in secrets.h
// #define WIFI_SSID "xxx"
// #define WIFI_PASSWORD "xxx"

#define BUTTON_PIN 15
#define GREEN_LED_PIN 2
#define RED_LED_PIN 4
#define BLUE_LED_PIN 16
#define BUZZZER_PIN 32
#define SENSOR_POWER_PIN 13
#define POST_SWITCH_PIN 27  // GPIO pin for the secondary button

#define FLASH_WIFI_CONNECT_FAILURE 2
#define FLASH_DISPLAY_INIT_FAILURE 3

#define WIFI_MAX_RETRIES 3

int dispLine = 0;
boolean SHOULD_POST = false;

Adafruit_SSD1306 display(128, 64, &Wire, -1);
LCD_I2C lcd(0x27, 16, 2);
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

void testLeds() {// TODO no need for this
  flashLED(GREEN_LED_PIN, 2);
  flashLED(BLUE_LED_PIN, 2);
  flashLED(RED_LED_PIN, 2);
}

void setup() {
  setupPins();

  Serial.begin(115200);
  Serial.println("Setup started");

  initDisplays();

  SHOULD_POST = digitalRead(POST_SWITCH_PIN) == LOW;
  if (SHOULD_POST) {
    Serial.println("  Will POST");
    dispPrint("Will POST");
  } else {
    Serial.println("  Will NOT post");
    dispPrint("Will NOT POST");
  }

  // TODO we only need wifi if we are to log data
  connectToWiFi();



  testLeds();  // TODO no need for this
  delay(5000);
  digitalWrite(SENSOR_POWER_PIN, LOW);
  // TODO when finfished setup? beep(50);

  Serial.println("setup done");
}

void loop() {  // do nothing
}
