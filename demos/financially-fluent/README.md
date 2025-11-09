# Servo Motor Interfacing - Complete Guide

## 📋 Overview

This repository contains comprehensive servo motor interfacing code for multiple platforms:

1. **Arduino** (`servo_motor_arduino.ino`) - Feature-rich Arduino servo control
2. **Raspberry Pi** (`servo_motor_raspberry_pi.py`) - Python GPIO control with web interface  
3. **MicroPython** (`servo_motor_micropython.py`) - Universal microcontroller support
4. **Advanced Control** (`advanced_servo_control.py`) - PID control, robotic arms, choreography

## 🔌 Hardware Connections

### Basic Servo Wiring
```
Servo Motor    →    Microcontroller
────────────────────────────────────
Signal (PWM)   →    Digital Pin (9 for Arduino, GPIO18 for RPi)
VCC (+5V)      →    5V Power Supply
GND            →    Ground
```

### Arduino Uno Connections
```
Pin 9     → Servo Signal (PWM)
5V        → Servo VCC (Red wire)
GND       → Servo GND (Black/Brown wire)

Optional Components:
Pin A0    → Potentiometer center pin (for manual control)
Pin 7     → Ultrasonic sensor TRIG
Pin 8     → Ultrasonic sensor ECHO  
Pin 2     → Push button (with internal pullup)
```

### Raspberry Pi GPIO
```
GPIO 18 (Pin 12)  → Servo 1 Signal
GPIO 19 (Pin 35)  → Servo 2 Signal (optional)
GPIO 21 (Pin 40)  → Button input
5V (Pin 2/4)      → Servo VCC
GND (Pin 6/9/14)  → Servo GND
```

### ESP32/ESP8266 (MicroPython)
```
GPIO 2    → Servo Signal
3.3V      → Servo VCC (for micro servos)
GND       → Servo Ground
```

## 🚀 Quick Start

### Arduino
1. Install Arduino IDE
2. Copy `servo_motor_arduino.ino` to Arduino IDE
3. Connect servo to pin 9
4. Upload and open Serial Monitor
5. Send commands: 's' (sweep), 'm' (manual), '90' (angle)

### Raspberry Pi
1. Install required packages:
   ```bash
   pip install RPi.GPIO gpiozero flask
   ```
2. Run the script:
   ```bash
   python3 servo_motor_raspberry_pi.py
   ```
3. Access web interface at `http://localhost:5000`

### MicroPython (ESP32/ESP8266/Pico)
1. Flash MicroPython firmware
2. Copy `servo_motor_micropython.py` to device
3. Run in REPL:
   ```python
   import servo_motor_micropython
   servo = servo_motor_micropython.ServoMotor(2)  # Pin 2
   servo.angle(90)  # Move to 90 degrees
   ```

## 💡 Features

### Arduino Code Features
- **Multiple Control Modes**: Sweep, manual (potentiometer), serial commands
- **Smooth Movement**: Gradual position changes for realistic motion
- **Sensor Integration**: Ultrasonic distance-based control
- **Button Control**: Physical button for mode switching
- **Speed Control**: Configurable movement speed
- **Serial Interface**: Real-time command input via Serial Monitor

### Raspberry Pi Features
- **Web Interface**: Browser-based servo control panel
- **Multiple Servos**: Support for multiple servo motors
- **REST API**: JSON-based control interface
- **Sequence Execution**: Predefined movement sequences
- **Real-time Status**: Live servo position feedback
- **Threading**: Non-blocking servo movements

### MicroPython Features
- **Universal Compatibility**: Works on ESP32, ESP8266, Pico, PyBoard
- **Calibration**: Interactive servo calibration routine
- **Multi-servo Control**: Coordinate multiple servos
- **Smooth Trajectories**: Mathematical motion planning
- **Interactive REPL**: Command-line servo control

### Advanced Features
- **PID Control**: Precise positioning with feedback control
- **Trajectory Planning**: Smooth S-curve motion profiles
- **Robotic Arm Control**: Multi-axis coordinated movement
- **Choreography**: Complex sequence programming
- **Emergency Stop**: Safety features for robotic applications

## 📊 Servo Control Methods

### 1. Angle Control
```python
# Direct angle setting (0-180 degrees)
servo.angle(90)          # Center position
servo.angle(0)           # Minimum position  
servo.angle(180)         # Maximum position
```

### 2. Smooth Movement
```python
# Gradual movement to target position
servo.smooth_move(180, speed=5)  # Move to 180° at speed 5
```

### 3. Sweep Motion
```python
# Oscillating movement between two angles
servo.sweep(min_angle=0, max_angle=180, cycles=3)
```

### 4. Pulse Width Control
```python
# Direct PWM pulse width control (microseconds)
servo.pulse_width(1500)  # Center position (typically 1500μs)
servo.pulse_width(1000)  # Minimum position (typically 1000μs)
servo.pulse_width(2000)  # Maximum position (typically 2000μs)
```

## 🎮 Control Interfaces

### Serial Commands (Arduino)
```
Commands via Serial Monitor:
's'     → Toggle sweep mode
'm'     → Toggle manual mode (potentiometer)  
'u'     → Ultrasonic distance control
'0-180' → Move to specific angle
```

### Web Interface (Raspberry Pi)
- Access `http://raspberry-pi-ip:5000`
- Real-time servo position sliders
- Quick angle buttons (0°, 45°, 90°, 135°, 180°)
- Predefined sequence execution
- Multiple servo support

### REST API (Raspberry Pi)
```bash
# Get servo status
curl http://localhost:5000/api/servos

# Move servo to angle
curl -X POST http://localhost:5000/api/move \
  -H "Content-Type: application/json" \
  -d '{"servo":"servo1", "angle":90, "smooth":true}'

# Run sequence
curl -X POST http://localhost:5000/api/sequence \
  -H "Content-Type: application/json" \
  -d '{"sequence":"wave"}'
```

## ⚙️ Configuration

### Servo Parameters
```python
# Standard servo parameters
min_pulse = 500   # Minimum pulse width (μs)
max_pulse = 2500  # Maximum pulse width (μs) 
frequency = 50    # PWM frequency (Hz)

# High-torque servo parameters  
min_pulse = 1000  # Minimum pulse width (μs)
max_pulse = 2000  # Maximum pulse width (μs)
frequency = 50    # PWM frequency (Hz)
```

### PID Tuning (Advanced)
```python
# PID controller parameters for precise positioning
kp = 2.0   # Proportional gain (responsiveness)
ki = 0.1   # Integral gain (steady-state error)
kd = 0.05  # Derivative gain (damping)
```

## 🛠️ Troubleshooting

### Common Issues

**Servo not moving:**
- Check power supply (servos need adequate current)
- Verify signal wire connection to PWM-capable pin
- Ensure correct pulse width range for your servo
- Check if servo is receiving power (VCC and GND)

**Jittery movement:**
- Add capacitors across power supply for smoothing
- Use external power supply for high-current servos
- Check for loose connections
- Reduce PWM frequency if necessary

**Incorrect positioning:**
- Calibrate servo using provided calibration functions
- Adjust min_pulse and max_pulse parameters
- Check for mechanical obstructions
- Verify servo is not damaged

**Web interface not accessible (Raspberry Pi):**
- Check if Flask is installed: `pip install flask`
- Verify firewall settings
- Ensure script is running as root for GPIO access
- Check network connectivity

### Performance Optimization

**Smooth Movement:**
```python
# Use trajectory planning for professional motion
servo.trajectory_move(target_angle=90, duration=2.0)

# Adjust update rates for smoothness vs. performance
update_interval = 20  # 20ms = 50Hz (good balance)
update_interval = 10  # 10ms = 100Hz (smoother, more CPU)
```

**Multiple Servos:**
```python
# Use threading for simultaneous movement
import threading

def move_servo_thread(servo, angle):
    servo.smooth_move(angle)

# Start multiple threads
thread1 = threading.Thread(target=move_servo_thread, args=(servo1, 90))
thread2 = threading.Thread(target=move_servo_thread, args=(servo2, 45))

thread1.start()
thread2.start()
```

## 📖 Example Projects

### 1. Pan-Tilt Camera Mount
```python
# Two servos for camera positioning
pan_servo = ServoMotor(18)    # Horizontal rotation
tilt_servo = ServoMotor(19)   # Vertical rotation

# Track object at coordinates (x, y)
def track_object(x, y, frame_width, frame_height):
    pan_angle = map_range(x, 0, frame_width, 0, 180)
    tilt_angle = map_range(y, 0, frame_height, 180, 0)  # Inverted
    
    pan_servo.smooth_move(pan_angle)
    tilt_servo.smooth_move(tilt_angle)
```

### 2. Robotic Arm Pick and Place
```python
# 5-DOF robotic arm
arm = RoboticArm([0, 1, 2, 3, 4])  # Servo channels

# Pick up object
pickup_position = {
    'base': 45, 'shoulder': 120, 'elbow': 60, 
    'wrist': 90, 'gripper': 180
}

# Place object
place_position = {
    'base': 135, 'shoulder': 120, 'elbow': 60,
    'wrist': 90, 'gripper': 180  
}

arm.perform_pick_and_place(pickup_position, place_position)
```

### 3. Servo Choreography
```python
# Create complex movement sequences
choreographer = ServoChoreographer({'servo1': servo1, 'servo2': servo2})

# Define dance sequence
dance_keyframes = [
    {'servo1': 90, 'servo2': 90},   # Starting position
    {'servo1': 45, 'servo2': 135},  # Lean left
    {'servo1': 135, 'servo2': 45},  # Lean right  
    {'servo1': 90, 'servo2': 90}    # Return center
]

dance_timing = [1.0, 0.5, 0.5, 1.0]  # Duration for each keyframe

choreographer.add_sequence('dance', dance_keyframes, dance_timing)
choreographer.play_sequence('dance', speed_multiplier=1.5)
```

## 🔧 Advanced Topics

### Custom Servo Drivers
For applications requiring many servos (16+), consider using dedicated PWM drivers:

- **PCA9685**: 16-channel I2C PWM driver
- **Adafruit Servo HAT**: Raspberry Pi-specific servo driver
- **Arduino Servo Shield**: Multiple servo control for Arduino

### Servo Feedback
Some servos provide position feedback for closed-loop control:
```python
# Read servo position (if feedback available)
current_position = servo.read_position()
error = target_position - current_position

# Implement feedback control
if abs(error) > tolerance:
    servo.adjust_position(error * gain)
```

### Power Considerations
- **Voltage**: Most servos operate at 4.8V-6V
- **Current**: Standard servos: 100-500mA, High-torque: 1-3A
- **Power Supply**: Use dedicated supply for multiple servos
- **Decoupling**: Add capacitors (100μF-1000μF) near servos

## 📚 Additional Resources

- [Servo Motor Theory](https://en.wikipedia.org/wiki/Servomotor)
- [PWM Signal Generation](https://learn.adafruit.com/adafruit-arduino-lesson-14-servo-motors/servo-motors)
- [PID Control Tutorial](https://en.wikipedia.org/wiki/PID_controller)
- [Robotics Kinematics](https://en.wikipedia.org/wiki/Robot_kinematics)

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for improvements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Servo Controlling! 🤖**