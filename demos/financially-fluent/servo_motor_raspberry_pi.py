#!/usr/bin/env python3
"""
Servo Motor Control for Raspberry Pi
====================================

This script provides comprehensive servo motor control using Raspberry Pi GPIO.
Supports multiple servo motors, different control modes, and web interface.

Hardware Requirements:
- Raspberry Pi (any model with GPIO)
- Servo motor(s)
- External power supply (recommended for multiple servos)
- Optional: Potentiometer, buttons, sensors

GPIO Connections:
- Servo Signal -> GPIO 18 (Pin 12) - Default servo
- Servo Signal 2 -> GPIO 19 (Pin 35) - Second servo (optional)
- Button -> GPIO 21 (Pin 40)
- Potentiometer -> MCP3008 ADC or use I2C ADC module

Installation Requirements:
pip install RPi.GPIO gpiozero flask threading
"""

import RPi.GPIO as GPIO
import time
import threading
from flask import Flask, render_template_string, request, jsonify
import json
import math

class ServoController:
    def __init__(self, pin, min_pulse=0.5, max_pulse=2.5, frequency=50):
        """
        Initialize servo controller
        
        Args:
            pin: GPIO pin number (BCM numbering)
            min_pulse: Minimum pulse width in milliseconds
            max_pulse: Maximum pulse width in milliseconds
            frequency: PWM frequency in Hz
        """
        self.pin = pin
        self.min_pulse = min_pulse
        self.max_pulse = max_pulse
        self.frequency = frequency
        self.current_angle = 90
        self.target_angle = 90
        self.is_moving = False
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.pin, self.frequency)
        self.pwm.start(0)
        
        # Move to initial position
        self.move_to_angle(90)
        
    def angle_to_duty_cycle(self, angle):
        """Convert angle (0-180) to PWM duty cycle"""
        angle = max(0, min(180, angle))  # Constrain angle
        pulse_width = self.min_pulse + (angle / 180.0) * (self.max_pulse - self.min_pulse)
        duty_cycle = (pulse_width / (1000.0 / self.frequency)) * 100
        return duty_cycle
    
    def move_to_angle(self, angle, speed=1):
        """
        Move servo to specific angle
        
        Args:
            angle: Target angle (0-180 degrees)
            speed: Movement speed (1-10, higher = faster)
        """
        self.target_angle = max(0, min(180, angle))
        duty_cycle = self.angle_to_duty_cycle(self.target_angle)
        self.pwm.ChangeDutyCycle(duty_cycle)
        self.current_angle = self.target_angle
        time.sleep(0.1)  # Small delay for servo to reach position
        
    def smooth_move_to_angle(self, target_angle, speed=5):
        """
        Smoothly move servo to target angle
        
        Args:
            target_angle: Destination angle
            speed: Movement speed (1-10)
        """
        self.is_moving = True
        target_angle = max(0, min(180, target_angle))
        step_size = speed
        delay = 0.02  # 20ms delay between steps
        
        while abs(self.current_angle - target_angle) > step_size:
            if self.current_angle < target_angle:
                self.current_angle += step_size
            else:
                self.current_angle -= step_size
                
            duty_cycle = self.angle_to_duty_cycle(self.current_angle)
            self.pwm.ChangeDutyCycle(duty_cycle)
            time.sleep(delay)
        
        # Final position
        self.current_angle = target_angle
        duty_cycle = self.angle_to_duty_cycle(self.current_angle)
        self.pwm.ChangeDutyCycle(duty_cycle)
        self.is_moving = False
    
    def sweep(self, min_angle=0, max_angle=180, speed=2, cycles=1):
        """
        Perform sweep motion between two angles
        
        Args:
            min_angle: Minimum sweep angle
            max_angle: Maximum sweep angle
            speed: Sweep speed
            cycles: Number of complete cycles
        """
        for cycle in range(cycles):
            # Sweep from min to max
            for angle in range(min_angle, max_angle + 1, speed):
                self.move_to_angle(angle)
                time.sleep(0.02)
            
            # Sweep from max to min
            for angle in range(max_angle, min_angle - 1, -speed):
                self.move_to_angle(angle)
                time.sleep(0.02)
    
    def stop(self):
        """Stop PWM and cleanup"""
        self.pwm.stop()
        GPIO.cleanup()

class MultiServoController:
    def __init__(self):
        """Initialize multiple servo controller"""
        self.servos = {}
        self.is_running = True
        self.web_app = Flask(__name__)
        self.setup_routes()
        
    def add_servo(self, name, pin, min_pulse=0.5, max_pulse=2.5):
        """Add a servo to the controller"""
        self.servos[name] = ServoController(pin, min_pulse, max_pulse)
        print(f"Added servo '{name}' on GPIO pin {pin}")
    
    def move_servo(self, name, angle, smooth=False, speed=5):
        """Move a specific servo"""
        if name in self.servos:
            if smooth:
                threading.Thread(
                    target=self.servos[name].smooth_move_to_angle,
                    args=(angle, speed)
                ).start()
            else:
                self.servos[name].move_to_angle(angle)
            return True
        return False
    
    def move_all_servos(self, angle, smooth=False, speed=5):
        """Move all servos to the same angle"""
        threads = []
        for servo in self.servos.values():
            if smooth:
                thread = threading.Thread(
                    target=servo.smooth_move_to_angle,
                    args=(angle, speed)
                )
                threads.append(thread)
                thread.start()
            else:
                servo.move_to_angle(angle)
        
        # Wait for all smooth movements to complete
        if smooth:
            for thread in threads:
                thread.join()
    
    def perform_sequence(self, sequence, delay=1):
        """
        Perform a predefined sequence of movements
        
        Args:
            sequence: List of dictionaries with servo positions
            delay: Delay between sequence steps
        """
        for step in sequence:
            for servo_name, angle in step.items():
                if servo_name in self.servos:
                    self.move_servo(servo_name, angle)
            time.sleep(delay)
    
    def setup_routes(self):
        """Setup Flask web interface routes"""
        
        @self.web_app.route('/')
        def index():
            return render_template_string(WEB_INTERFACE_HTML)
        
        @self.web_app.route('/api/servos')
        def get_servos():
            servo_data = {}
            for name, servo in self.servos.items():
                servo_data[name] = {
                    'current_angle': servo.current_angle,
                    'target_angle': servo.target_angle,
                    'is_moving': servo.is_moving
                }
            return jsonify(servo_data)
        
        @self.web_app.route('/api/move', methods=['POST'])
        def move_servo_api():
            data = request.json
            servo_name = data.get('servo')
            angle = data.get('angle')
            smooth = data.get('smooth', False)
            speed = data.get('speed', 5)
            
            if self.move_servo(servo_name, angle, smooth, speed):
                return jsonify({'status': 'success'})
            else:
                return jsonify({'status': 'error', 'message': 'Servo not found'})
        
        @self.web_app.route('/api/sequence', methods=['POST'])
        def run_sequence():
            data = request.json
            sequence_name = data.get('sequence')
            
            sequences = {
                'wave': [
                    {'servo1': 90, 'servo2': 90},
                    {'servo1': 45, 'servo2': 135},
                    {'servo1': 135, 'servo2': 45},
                    {'servo1': 90, 'servo2': 90}
                ],
                'dance': [
                    {'servo1': 0, 'servo2': 180},
                    {'servo1': 180, 'servo2': 0},
                    {'servo1': 90, 'servo2': 90}
                ]
            }
            
            if sequence_name in sequences:
                threading.Thread(
                    target=self.perform_sequence,
                    args=(sequences[sequence_name], 0.5)
                ).start()
                return jsonify({'status': 'success'})
            else:
                return jsonify({'status': 'error', 'message': 'Sequence not found'})
    
    def start_web_interface(self, host='0.0.0.0', port=5000):
        """Start the web interface"""
        print(f"Starting web interface on http://{host}:{port}")
        self.web_app.run(host=host, port=port, debug=False)
    
    def cleanup(self):
        """Clean up all servos"""
        for servo in self.servos.values():
            servo.stop()

# Web interface HTML template
WEB_INTERFACE_HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>Servo Motor Controller</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .servo-control { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .slider { width: 100%; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        .angle-display { font-size: 24px; font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Servo Motor Controller</h1>
        
        <div id="servos"></div>
        
        <div class="servo-control">
            <h3>Quick Actions</h3>
            <button onclick="moveAllServos(0)">All to 0°</button>
            <button onclick="moveAllServos(90)">All to 90°</button>
            <button onclick="moveAllServos(180)">All to 180°</button>
            <button onclick="runSequence('wave')">Wave Sequence</button>
            <button onclick="runSequence('dance')">Dance Sequence</button>
        </div>
    </div>

    <script>
        let servos = {};

        function updateServoDisplay() {
            fetch('/api/servos')
                .then(response => response.json())
                .then(data => {
                    servos = data;
                    const container = document.getElementById('servos');
                    container.innerHTML = '';
                    
                    for (let [name, servo] of Object.entries(servos)) {
                        container.innerHTML += `
                            <div class="servo-control">
                                <h3>${name.toUpperCase()}</h3>
                                <div class="angle-display">${servo.current_angle}°</div>
                                <input type="range" class="slider" min="0" max="180" value="${servo.current_angle}"
                                       onchange="moveServo('${name}', this.value)" id="slider-${name}">
                                <br>
                                <button onclick="moveServo('${name}', 0)">0°</button>
                                <button onclick="moveServo('${name}', 45)">45°</button>
                                <button onclick="moveServo('${name}', 90)">90°</button>
                                <button onclick="moveServo('${name}', 135)">135°</button>
                                <button onclick="moveServo('${name}', 180)">180°</button>
                            </div>
                        `;
                    }
                });
        }

        function moveServo(name, angle) {
            fetch('/api/move', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({servo: name, angle: parseInt(angle), smooth: true, speed: 3})
            });
        }

        function moveAllServos(angle) {
            for (let name of Object.keys(servos)) {
                moveServo(name, angle);
            }
        }

        function runSequence(sequenceName) {
            fetch('/api/sequence', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({sequence: sequenceName})
            });
        }

        // Update display every 500ms
        setInterval(updateServoDisplay, 500);
        updateServoDisplay();
    </script>
</body>
</html>
'''

def main():
    """Main function demonstrating servo control"""
    try:
        print("🤖 Initializing Servo Motor Controller...")
        
        # Create controller and add servos
        controller = MultiServoController()
        controller.add_servo('servo1', 18)  # GPIO 18
        controller.add_servo('servo2', 19)  # GPIO 19 (optional)
        
        print("\n📋 Available Commands:")
        print("1. Basic movement test")
        print("2. Sweep test")
        print("3. Sequence test")
        print("4. Start web interface")
        print("5. Interactive mode")
        print("q. Quit")
        
        while True:
            command = input("\nEnter command (1-5, q): ").strip()
            
            if command == '1':
                print("Testing basic movements...")
                controller.move_all_servos(0)
                time.sleep(1)
                controller.move_all_servos(90)
                time.sleep(1)
                controller.move_all_servos(180)
                time.sleep(1)
                controller.move_all_servos(90)
                
            elif command == '2':
                print("Testing sweep motion...")
                for servo in controller.servos.values():
                    threading.Thread(target=servo.sweep, args=(0, 180, 3, 2)).start()
                
            elif command == '3':
                print("Running demo sequence...")
                demo_sequence = [
                    {'servo1': 90, 'servo2': 90},
                    {'servo1': 45, 'servo2': 135},
                    {'servo1': 135, 'servo2': 45},
                    {'servo1': 0, 'servo2': 180},
                    {'servo1': 180, 'servo2': 0},
                    {'servo1': 90, 'servo2': 90}
                ]
                controller.perform_sequence(demo_sequence, 1)
                
            elif command == '4':
                print("Starting web interface...")
                print("Access the control panel at: http://localhost:5000")
                controller.start_web_interface()
                
            elif command == '5':
                print("Interactive mode - Enter servo name and angle (e.g., 'servo1 90') or 'exit':")
                while True:
                    user_input = input("servo> ").strip()
                    if user_input.lower() == 'exit':
                        break
                    
                    try:
                        parts = user_input.split()
                        servo_name = parts[0]
                        angle = int(parts[1])
                        
                        if controller.move_servo(servo_name, angle, smooth=True):
                            print(f"Moving {servo_name} to {angle}°")
                        else:
                            print(f"Servo '{servo_name}' not found")
                    except (IndexError, ValueError):
                        print("Invalid input. Use format: servo_name angle")
                        print("Available servos:", list(controller.servos.keys()))
            
            elif command.lower() == 'q':
                break
            else:
                print("Invalid command!")
    
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        print("🧹 Cleaning up...")
        controller.cleanup()
        print("✅ Done!")

if __name__ == "__main__":
    main()