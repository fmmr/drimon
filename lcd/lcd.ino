#include <LCD_I2C.h>

LCD_I2C lcd(0x27, 16, 2);  // Default address of most PCF8574 modules, change according

#define DEGREE 223

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
  lcd.clear();
  lcd.backlight();
  lcd.home();

  // PRINT DATA
  lcd.print(F("FmR Drivhus 2024"));
  lcd.setCursor(0, 1);
  lcd.print("T: ");
  lcd.print(27);
  lcd.print((char)DEGREE);
  lcd.print("  L: ");
  lcd.print(54874);
}

void loop() {
}