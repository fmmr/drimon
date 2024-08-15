// the number of the LED pin
const int ledPinPwm = 18;  // 16 corresponds to GPIO16
int ledPins[] = { 13, 12, 14 };
const byte chns[] = { 1, 2, 3 };
int red, green, blue;

// setting PWM properties
const int freq = 5000;
const int ledChannel = 0;
const int resolution = 8;

// set pin numbers
const int buttonPin = 4;  // the number of the pushbutton pin
const int ledPin = 5;     // the number of the LED pin
const int potPin = 34;

// variable for storing the pushbutton status
void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT);  // initialize the pushbutton pin as an input
  pinMode(ledPin, OUTPUT);    // initialize the LED pin as an output

  ledcSetup(ledChannel, freq, resolution);
  ledcAttachPin(ledPinPwm, ledChannel);

  for (int i = 0; i < 3; i++) {
    ledcSetup(chns[i], freq, 8);
    ledcAttachPin(ledPins[i], chns[i]);
  }
}

void loop() {
  checkButton();
  potMeter();
  // fadeInFadeOut();
  delay(20);
}

void fadeInFadeOut() {
  // increase the LED brightness
  for (int dutyCycle = 0; dutyCycle <= 255; dutyCycle++) {  // changing the LED brightness with PWM
    ledcWrite(ledChannel, dutyCycle);
    delay(1);
  }
  delay(50);
  // decrease the LED brightness
  for (int dutyCycle = 255; dutyCycle >= 0; dutyCycle--) {  // changing the LED brightness with PWM
    ledcWrite(ledChannel, dutyCycle);
    delay(1);
  }
}

int potMeter() {
  int potValue = analogRead(potPin);
  int degrees = map(potValue, 0, 4095, 0, 360);
  float potFloat = degrees / 360.0;
  // Serial.println(potValue);
  Serial.print("pot: ");
  Serial.print(potValue);
  Serial.print(", degress: ");
  Serial.print(degrees);
  Serial.print(", ");
  Serial.print(potFloat * 100);
  Serial.println("%");
  setColor(potFloat);
  return potValue;
}

void checkButton() {
  int buttonState = digitalRead(buttonPin);
  Serial.print("Button: ");     // check if the pushbutton is pressed.
  Serial.println(buttonState);  // check if the pushbutton is pressed.
  if (buttonState == HIGH) {
    // turn LED on
    digitalWrite(ledPin, HIGH);
  } else {
    // turn LED off
    digitalWrite(ledPin, LOW);
  }
}

void setColor(float h) {
  float s = 1.0;
  float l = 0.5;
  float q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  float p = 2 * l - q;
  int r = hue2rgb(p, q, h + 1. / 3) * 255;
  int g = hue2rgb(p, q, h) * 255;
  int b = hue2rgb(p, q, h - 1. / 3) * 255;
  Serial.print("rgb: ");
  Serial.print(r);
  Serial.print(", ");
  Serial.print(g);
  Serial.print(", ");
  Serial.println(b);
  setColor(r, g, b);
}

void setColor(byte r, byte g, byte b) {
  ledcWrite(chns[0], g);
  ledcWrite(chns[1], r);
  ledcWrite(chns[2], b);
  ledcWrite(ledChannel, r);
}


float hue2rgb(float p, float q, float t) {
  if (t < 0)
    t += 1;
  if (t > 1)
    t -= 1;
  if (t < 1. / 6)
    return p + (q - p) * 6 * t;
  if (t < 1. / 2)
    return q;
  if (t < 2. / 3)
    return p + (q - p) * (2. / 3 - t) * 6;
  return p;
}