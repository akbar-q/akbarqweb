/*
 * Servo Motor Interfacing with Arduino
 * 
 * This code demonstrates how to control a servo motor using Arduino
 * Supports multiple control methods: sweep, angle control, and sensor-based control
 * 
 * Hardware Connections:
 * - Servo Signal Pin -> Arduino Pin 9
 * - Servo VCC -> 5V (or external power supply for high-torque servos)
 * - Servo GND -> GND
 * - Optional: Potentiometer middle pin -> A0 (for manual control)
 * - Optional: Ultrasonic sensor Trig -> Pin 7, Echo -> Pin 8
 */

#include <Servo.h>

// Create servo object
Servo myServo;

// Pin definitions
const int SERVO_PIN = 9;
const int POT_PIN = A0;
const int TRIG_PIN = 7;
const int ECHO_PIN = 8;
const int BUTTON_PIN = 2;

// Variables
int servoPosition = 90;  // Current servo position
int targetPosition = 90; // Target position
bool sweepMode = false;
bool manualMode = true;
int sweepDirection = 1;
unsigned long lastUpdate = 0;
const int UPDATE_INTERVAL = 20; // Update every 20ms for smooth movement

void setup() {
  Serial.begin(9600);
  
  // Initialize servo
  myServo.attach(SERVO_PIN);
  myServo.write(servoPosition);
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  Serial.println("Servo Motor Controller Ready!");
  Serial.println("Commands:");
  Serial.println("'s' - Toggle sweep mode");
  Serial.println("'m' - Toggle manual mode");
  Serial.println("'0-180' - Set specific angle");
  Serial.println("'u' - Ultrasonic distance control");
  
  delay(1000);
}

void loop() {
  // Check for serial commands
  handleSerialCommands();
  
  // Check button for mode switching
  if (digitalRead(BUTTON_PIN) == LOW) {
    sweepMode = !sweepMode;
    manualMode = false;
    Serial.println(sweepMode ? "Sweep Mode ON" : "Sweep Mode OFF");
    delay(300); // Debounce
  }
  
  // Update servo position based on current mode
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    if (sweepMode) {
      performSweep();
    } else if (manualMode) {
      readPotentiometer();
    }
    
    // Smooth servo movement
    smoothServoMove();
    lastUpdate = millis();
  }
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "s") {
      sweepMode = !sweepMode;
      manualMode = false;
      Serial.println(sweepMode ? "Sweep Mode ON" : "Sweep Mode OFF");
    }
    else if (command == "m") {
      manualMode = !manualMode;
      sweepMode = false;
      Serial.println(manualMode ? "Manual Mode ON" : "Manual Mode OFF");
    }
    else if (command == "u") {
      ultrasonicControl();
    }
    else if (command.toInt() >= 0 && command.toInt() <= 180) {
      targetPosition = command.toInt();
      sweepMode = false;
      manualMode = false;
      Serial.println("Moving to angle: " + String(targetPosition));
    }
    else {
      Serial.println("Invalid command!");
    }
  }
}

void performSweep() {
  // Sweep between 0 and 180 degrees
  targetPosition += (sweepDirection * 2);
  
  if (targetPosition >= 180) {
    targetPosition = 180;
    sweepDirection = -1;
  } else if (targetPosition <= 0) {
    targetPosition = 0;
    sweepDirection = 1;
  }
}

void readPotentiometer() {
  // Read potentiometer and map to servo range
  int potValue = analogRead(POT_PIN);
  targetPosition = map(potValue, 0, 1023, 0, 180);
}

void smoothServoMove() {
  // Smooth movement towards target position
  if (servoPosition < targetPosition) {
    servoPosition++;
  } else if (servoPosition > targetPosition) {
    servoPosition--;
  }
  
  // Constrain to valid servo range
  servoPosition = constrain(servoPosition, 0, 180);
  
  // Write to servo
  myServo.write(servoPosition);
  
  // Print position for debugging
  static int lastPrintedPosition = -1;
  if (servoPosition != lastPrintedPosition) {
    Serial.println("Servo Position: " + String(servoPosition) + "°");
    lastPrintedPosition = servoPosition;
  }
}

void ultrasonicControl() {
  // Use ultrasonic sensor to control servo position
  long duration, distance;
  
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  duration = pulseIn(ECHO_PIN, HIGH);
  distance = (duration * 0.034) / 2; // Convert to cm
  
  // Map distance to servo angle (0-50cm -> 0-180°)
  if (distance > 0 && distance <= 50) {
    targetPosition = map(distance, 0, 50, 0, 180);
    Serial.println("Distance: " + String(distance) + "cm, Angle: " + String(targetPosition) + "°");
  }
  
  sweepMode = false;
  manualMode = false;
}

// Advanced servo control functions
void moveToAngleWithSpeed(int angle, int speed) {
  // Move to specific angle with controlled speed
  int startPosition = servoPosition;
  int endPosition = constrain(angle, 0, 180);
  int steps = abs(endPosition - startPosition);
  int stepDelay = map(speed, 1, 10, 100, 10); // Speed 1-10, higher = faster
  
  for (int i = 0; i <= steps; i++) {
    int currentPos = map(i, 0, steps, startPosition, endPosition);
    myServo.write(currentPos);
    servoPosition = currentPos;
    Serial.println("Moving: " + String(currentPos) + "°");
    delay(stepDelay);
  }
}

void servoSequence() {
  // Perform a predefined sequence
  int sequence[] = {90, 45, 135, 0, 180, 90};
  int sequenceLength = sizeof(sequence) / sizeof(sequence[0]);
  
  Serial.println("Starting servo sequence...");
  
  for (int i = 0; i < sequenceLength; i++) {
    moveToAngleWithSpeed(sequence[i], 5);
    delay(500); // Pause between movements
  }
  
  Serial.println("Sequence complete!");
}

// Emergency stop function
void emergencyStop() {
  // Immediately stop all movement
  sweepMode = false;
  manualMode = false;
  targetPosition = servoPosition;
  Serial.println("EMERGENCY STOP!");
}