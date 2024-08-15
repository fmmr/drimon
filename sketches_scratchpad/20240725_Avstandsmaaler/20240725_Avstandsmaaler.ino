#include <Adafruit_SSD1306.h>
#include <Adafruit_VL53L0X.h>
Adafruit_VL53L0X tof = Adafruit_VL53L0X();
Adafruit_SSD1306 display(128, 64, &Wire, -1);
VL53L0X_RangingMeasurementData_t tofData;

void setup() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
      Serial.println("SSD1306 allocation failed");
    } else {
      display.clearDisplay();

      display.setTextSize(5);
      display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
      Serial.println("    SSD1306 Initialized");
    }
  if (!tof.begin()) {
    Serial.println("    VL53L0X (tof): Failed");
  } else {
    Serial.println("    VL53L0X (tof): OK");
  }

}

void loop() {
    tof.rangingTest(&tofData, false);
    int total_distance = tofData.RangeMilliMeter;

    display.clearDisplay();
            display.setCursor(0, 17);

    display.print(total_distance);
    display.display();

    delay(400);
}
