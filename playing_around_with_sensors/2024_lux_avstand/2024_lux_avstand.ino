#include <Arduino.h>
#include <Wire.h>
#include <BH1750.h>

// Define pins for the HC-SR04
#define TRIGGER_PIN 2
#define ECHO_PIN 3

// Create an instance of the BH1750 sensor
BH1750 lightMeter;

void setup() {
  // Initialize the serial communication
  Serial.begin(9600);

  // Configure the trigger and echo pins
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Ensure the trigger pin is set LOW
  digitalWrite(TRIGGER_PIN, LOW);

  // Initialize the I2C communication
  Wire.begin();

  // Initialize the BH1750 sensor
  if (lightMeter.begin()) {
    Serial.println("BH1750 sensor initialized successfully");
  } else {
    Serial.println("Error initializing BH1750 sensor");
  }
}

void loop() {
  // Measure distance using HC-SR04
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.0343 / 2;

  // Print the distance to the serial monitor
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Measure light intensity using BH1750
  float lux = lightMeter.readLightLevel();

  // Print the light intensity to the serial monitor
  Serial.print("Light Intensity: ");
  Serial.print(lux);
  Serial.println(" lx");

  // Wait for a short time before the next measurement
  delay(1000);
}
