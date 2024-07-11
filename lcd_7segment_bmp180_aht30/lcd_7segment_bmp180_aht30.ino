#include <TM1637Display.h>
#include <LCD_I2C.h>
#include <Adafruit_BMP085.h>
#include <Adafruit_AHTX0.h>

#define seaLevelPressure_hPa 1013.25
#define CLK 13
#define DIO 12

#define DEGREE 223

LCD_I2C lcd(0x27, 16, 2);  // Default address of most PCF8574 modules, change according
TM1637Display display(CLK, DIO);
Adafruit_BMP085 bmp;
Adafruit_AHTX0 aht;
Adafruit_Sensor *aht_humidity, *aht_temp;

// byte AE[8] = {
//   0b01100,
//   0b10011,
//   0b10010,
//   0b10010,
//   0b11111,
//   0b10010,
//   0b10011,
//   0b00000
// };

// byte AA[8] = {
//   0b00100,
//   0b00000,
//   0b01110,
//   0b10001,
//   0b11111,
//   0b10001,
//   0b10001,
//   0b00000
// };


void setup() {
  Serial.begin(115200);
  if (!bmp.begin()) {
    Serial.println("Could not find a valid BMP085 sensor, check wiring!");
    while (1) {}
  }
  if (!aht.begin()) {
    Serial.println("Failed to find AHT10/AHT20 chip");
    while (1) {
      delay(10);
    }
  }

  aht_temp = aht.getTemperatureSensor();

  aht_humidity = aht.getHumiditySensor();
  // INIT
  lcd.begin();  // If you are using more I2C devices using the Wire library use lcd.begin(false) this stop the library(LCD_I2C) from calling Wire.begin()
  lcd.backlight();
  display.setBrightness(0x0f);

  lcd.clear();
  lcd.home();
  lcd.print(F("FmR Drivhus 2024"));
}



int capLuxMax = 64000;
int capLuxMin = 0;
int lastLux = 1000;

int percent = 10;

void loop() {

  sensors_event_t humidity;
  sensors_event_t ahtTemp;
  aht_humidity->getEvent(&humidity);
  aht_temp->getEvent(&ahtTemp);
  int temp = bmp.readTemperature();
  float pre = bmp.readSealevelPressure(31.0) /100.0;

  Serial.print("Air pressure (at sea level): ");
  Serial.print(pre);
  Serial.println(" hPa");
  
  Serial.print("Humidity: ");
  Serial.print(humidity.relative_humidity);
  Serial.println(" % rH");
  
  Serial.print("Temperature BMP = ");
  Serial.print(bmp.readTemperature());
  Serial.println(" *C");

  
  Serial.print("Temperature AHT = ");
  Serial.print(ahtTemp.temperature);
  Serial.println(" *C");
  Serial.println();

  int lux = random(max(capLuxMin, lastLux - (percent * lastLux / 100)), min(capLuxMax, lastLux + (percent * lastLux / 100)));
  lastLux = lux;
  lcd.setCursor(0, 1);
  lcd.print("T: ");
  if (temp < 10) {
    lcd.print(" ");
  }
  lcd.print(temp);
  lcd.print((char)DEGREE);
  lcd.print("  L: ");
  if (lux < 10000) {
    lcd.print(" ");
  }
  if (lux < 1000) {
    lcd.print(" ");
  }
  if (lux < 100) {
    lcd.print(" ");
  }
  if (lux < 10) {
    lcd.print(" ");
  }
  lcd.print(lux);

  display.showNumberDec(temp, false);

  delay(2500);
}