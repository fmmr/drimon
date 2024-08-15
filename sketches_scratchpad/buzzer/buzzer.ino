/*
 * This ESP32 code is created by esp32io.com
 *
 * This ESP32 code is released in the public domain
 *
 * For more detail (instruction and wiring diagram), visit https://esp32io.com/tutorials/esp32-piezo-buzzer
 */

#include "pitches.h"
#define BUZZZER_PIN 32  // ESP32 pin GPIO18 connected to piezo buzzer

int melody[] = {
  NOTE_C4, NOTE_G3, NOTE_G3, NOTE_A3, NOTE_G3, 0, NOTE_B3, NOTE_C4
};

int noteDurations[] = {
  4, 8, 8, 4, 4, 4, 4, 4
};

void setup() {
  Serial.begin(115200);  // opens serial port, sets data rate to 115200 bps
  pinMode(BUZZZER_PIN, OUTPUT);
}

void play() {
  for (int thisNote = 0; thisNote < 8; thisNote++) {
    int noteDuration = 1000 / noteDurations[thisNote];
    tone(BUZZZER_PIN, melody[thisNote], noteDuration);

    int pauseBetweenNotes = noteDuration * 1.30;
    delay(pauseBetweenNotes);
    noTone(BUZZZER_PIN);
  }
}
void loop() {
  Serial.println("Long");
  //play();
  //noTone(BUZZZER_PIN);
digitalWrite(BUZZZER_PIN, HIGH);
  delay(1000);
digitalWrite(BUZZZER_PIN, LOW);
  delay(1000);

  Serial.println("200");

digitalWrite(BUZZZER_PIN, HIGH);
  delay(200);
digitalWrite(BUZZZER_PIN, LOW);
  delay(1000);

  Serial.println("100");

digitalWrite(BUZZZER_PIN, HIGH);
  delay(100);
digitalWrite(BUZZZER_PIN, LOW);
  delay(1000);

  Serial.println("50");

digitalWrite(BUZZZER_PIN, HIGH);
  delay(50);
digitalWrite(BUZZZER_PIN, LOW);
  delay(1000);
}
