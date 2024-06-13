#include <TM1637Display.h>
#include <LCD_I2C.h>

#define CLK 13
#define DIO 12

#define DEGREE 223

LCD_I2C lcd(0x27, 16, 2);  // Default address of most PCF8574 modules, change according
TM1637Display display(CLK, DIO);

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

  // INIT
  lcd.begin();  // If you are using more I2C devices using the Wire library use lcd.begin(false) this stop the library(LCD_I2C) from calling Wire.begin()
  lcd.backlight();
  display.setBrightness(0x0f);

  lcd.clear();
  lcd.home();
  lcd.print(F("FmR Drivhus 2024"));
}


int capTempMax = 44;
int capTempMin = -10;
int lastTemp = 20;

int capLuxMax = 64000;
int capLuxMin = 0;
int lastLux = 1000;

int percent = 10;

void loop() {


  int temp = random(max(capTempMin, lastTemp - (percent * lastTemp / 100)), min(capTempMax, lastTemp + (percent * lastTemp / 100)));
  int lux = random(max(capLuxMin, lastLux - (percent * lastLux / 100)), min(capLuxMax, lastLux + (percent * lastLux / 100)));

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

  delay(3000);
}