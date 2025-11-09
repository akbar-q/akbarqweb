"""
Universal Servo Motor Controller - MicroPython
=============================================

Compatible with: ESP32, ESP8266, Raspberry Pi Pico, PyBoard
This script provides servo motor control using PWM signals

Hardware Setup:
- Servo Signal Wire -> GPIO Pin (configurable)
- Servo VCC -> 3.3V or 5V (check servo specifications)
- Servo GND -> Ground

Usage Examples:
- Basic control: servo.angle(90)  # Move to 90 degrees
- Smooth movement: servo.smooth_move(180, speed=5)
- Sweep motion: servo.sweep(0, 180, cycles=3)
"""

from machine import Pin, PWM
import time
import math

class ServoMotor:
    """
    Universal servo motor controller for MicroPython platforms
    """
    
    def __init__(self, pin_number, frequency=50, min_us=500, max_us=2500):
        """
        Initialize servo motor controller
        
        Args:
            pin_number: GPIO pin number for servo signal
            frequency: PWM frequency in Hz (typically 50Hz for servos)
            min_us: Minimum pulse width in microseconds (0 degrees)
            max_us: Maximum pulse width in microseconds (180 degrees)
        """
        self.pin = Pin(pin_number, Pin.OUT)
        self.pwm = PWM(self.pin)
        self.pwm.freq(frequency)
        
        self.min_us = min_us
        self.max_us = max_us
        self.frequency = frequency
        self.current_angle = 90
        
        # Calculate duty cycle range (16-bit PWM)
        self.max_duty = 65535
        self.min_duty = int((min_us * self.max_duty * frequency) / 1000000)
        self.max_duty_servo = int((max_us * self.max_duty * frequency) / 1000000)
        
        # Move to center position
        self.angle(90)
        
        print(f"Servo initialized on pin {pin_number}")
        print(f"Frequency: {frequency}Hz")
        print(f"Pulse range: {min_us}-{max_us}μs")
    
    def _angle_to_duty(self, angle):
        """Convert angle (0-180) to PWM duty cycle"""
        # Constrain angle to valid range
        angle = max(0, min(180, angle))
        
        # Map angle to duty cycle
        duty_range = self.max_duty_servo - self.min_duty
        duty = self.min_duty + int((angle / 180.0) * duty_range)
        
        return duty
    
    def angle(self, degrees):
        """
        Set servo to specific angle
        
        Args:
            degrees: Target angle (0-180 degrees)
        """
        degrees = max(0, min(180, degrees))
        duty = self._angle_to_duty(degrees)
        self.pwm.duty_u16(duty)
        self.current_angle = degrees
        
        print(f"Servo moved to {degrees}°")
    
    def smooth_move(self, target_angle, speed=5, step_delay=20):
        """
        Smoothly move servo to target angle
        
        Args:
            target_angle: Destination angle (0-180)
            speed: Movement speed (1-10, higher = faster)
            step_delay: Delay between steps in milliseconds
        """
        target_angle = max(0, min(180, target_angle))
        step_size = max(1, speed)
        
        print(f"Smooth moving from {self.current_angle}° to {target_angle}°")
        
        while abs(self.current_angle - target_angle) > step_size:
            if self.current_angle < target_angle:
                self.current_angle = min(self.current_angle + step_size, target_angle)
            else:
                self.current_angle = max(self.current_angle - step_size, target_angle)
            
            duty = self._angle_to_duty(self.current_angle)
            self.pwm.duty_u16(duty)
            time.sleep_ms(step_delay)
        
        # Ensure we reach exact target
        self.angle(target_angle)
        print(f"Reached target: {target_angle}°")
    
    def sweep(self, min_angle=0, max_angle=180, speed=2, cycles=1):
        """
        Perform sweep motion between two angles
        
        Args:
            min_angle: Minimum sweep angle
            max_angle: Maximum sweep angle  
            speed: Sweep speed (higher = faster)
            cycles: Number of complete sweep cycles
        """
        print(f"Starting sweep: {min_angle}°-{max_angle}°, {cycles} cycles")
        
        for cycle in range(cycles):
            print(f"Cycle {cycle + 1}/{cycles}")
            
            # Sweep from min to max
            for angle in range(min_angle, max_angle + 1, speed):
                self.angle(angle)
                time.sleep_ms(20)
            
            # Sweep from max to min
            for angle in range(max_angle, min_angle - 1, -speed):
                self.angle(angle)
                time.sleep_ms(20)
        
        print("Sweep complete")
    
    def pulse_width(self, microseconds):
        """
        Set servo position using pulse width in microseconds
        
        Args:
            microseconds: Pulse width (typically 500-2500μs)
        """
        microseconds = max(self.min_us, min(self.max_us, microseconds))
        angle = ((microseconds - self.min_us) / (self.max_us - self.min_us)) * 180
        self.angle(angle)
    
    def calibrate(self):
        """
        Interactive calibration routine to find servo limits
        """
        print("=== Servo Calibration ===")
        print("This will help find the optimal pulse width range for your servo")
        
        # Test center position
        print("Moving to center position...")
        self.pulse_width(1500)
        time.sleep(2)
        
        # Test minimum position
        print("Testing minimum position...")
        for us in range(500, 1500, 50):
            self.pulse_width(us)
            time.sleep(0.1)
        
        # Test maximum position
        print("Testing maximum position...")
        for us in range(1500, 2500, 50):
            self.pulse_width(us)
            time.sleep(0.1)
        
        # Return to center
        self.pulse_width(1500)
        print("Calibration complete - returned to center")
    
    def disable(self):
        """Disable PWM signal to servo (servo will lose holding torque)"""
        self.pwm.duty_u16(0)
        print("Servo disabled")
    
    def enable(self):
        """Re-enable servo at current angle"""
        duty = self._angle_to_duty(self.current_angle)
        self.pwm.duty_u16(duty)
        print(f"Servo enabled at {self.current_angle}°")
    
    def deinit(self):
        """Clean up PWM resources"""
        self.pwm.deinit()
        print("Servo deinitialized")

class MultiServo:
    """
    Controller for multiple servo motors
    """
    
    def __init__(self):
        self.servos = {}
    
    def add_servo(self, name, pin, **kwargs):
        """Add a servo to the controller"""
        self.servos[name] = ServoMotor(pin, **kwargs)
        print(f"Added servo '{name}' on pin {pin}")
    
    def move_servo(self, name, angle):
        """Move specific servo to angle"""
        if name in self.servos:
            self.servos[name].angle(angle)
            return True
        else:
            print(f"Servo '{name}' not found")
            return False
    
    def move_all(self, angle):
        """Move all servos to the same angle"""
        for name, servo in self.servos.items():
            servo.angle(angle)
            print(f"Moved {name} to {angle}°")
    
    def smooth_move_all(self, angle, speed=5):
        """Smoothly move all servos simultaneously"""
        import _thread
        
        def move_servo_thread(servo, target, spd):
            servo.smooth_move(target, spd)
        
        # Start threads for each servo
        for servo in self.servos.values():
            _thread.start_new_thread(move_servo_thread, (servo, angle, speed))
        
        # Wait for movements to complete (simplified)
        time.sleep(2)
    
    def perform_sequence(self, sequence, delay=1):
        """
        Execute a sequence of servo positions
        
        Args:
            sequence: List of dictionaries with servo positions
                     Example: [{'servo1': 90, 'servo2': 45}, {'servo1': 180, 'servo2': 0}]
            delay: Delay between sequence steps in seconds
        """
        print("Starting sequence...")
        
        for step_num, step in enumerate(sequence):
            print(f"Step {step_num + 1}: {step}")
            
            for servo_name, angle in step.items():
                if servo_name in self.servos:
                    self.servos[servo_name].angle(angle)
                else:
                    print(f"Warning: Servo '{servo_name}' not found")
            
            time.sleep(delay)
        
        print("Sequence complete")
    
    def disable_all(self):
        """Disable all servos"""
        for servo in self.servos.values():
            servo.disable()
    
    def enable_all(self):
        """Enable all servos"""
        for servo in self.servos.values():
            servo.enable()

# Demo and test functions
def demo_single_servo():
    """Demonstrate single servo control"""
    print("=== Single Servo Demo ===")
    
    # Create servo on pin 2 (adjust for your board)
    servo = ServoMotor(2)
    
    # Basic movements
    print("Basic angle control:")
    for angle in [0, 45, 90, 135, 180]:
        servo.angle(angle)
        time.sleep(1)
    
    # Smooth movement
    print("Smooth movement:")
    servo.smooth_move(0, speed=3)
    time.sleep(1)
    servo.smooth_move(180, speed=8)
    
    # Sweep motion
    print("Sweep motion:")
    servo.sweep(30, 150, speed=3, cycles=2)
    
    # Return to center
    servo.angle(90)
    
    return servo

def demo_multi_servo():
    """Demonstrate multiple servo control"""
    print("=== Multi-Servo Demo ===")
    
    # Create multi-servo controller
    controller = MultiServo()
    controller.add_servo('pan', 2)    # Pan servo on pin 2
    controller.add_servo('tilt', 4)   # Tilt servo on pin 4
    
    # Test individual control
    print("Individual control:")
    controller.move_servo('pan', 45)
    controller.move_servo('tilt', 135)
    time.sleep(1)
    
    # Test synchronized movement
    print("Synchronized movement:")
    controller.move_all(90)
    time.sleep(1)
    
    # Test sequence
    print("Running sequence:")
    pan_tilt_sequence = [
        {'pan': 90, 'tilt': 90},   # Center
        {'pan': 45, 'tilt': 135},  # Look up-left
        {'pan': 135, 'tilt': 135}, # Look up-right
        {'pan': 135, 'tilt': 45},  # Look down-right
        {'pan': 45, 'tilt': 45},   # Look down-left
        {'pan': 90, 'tilt': 90},   # Return center
    ]
    
    controller.perform_sequence(pan_tilt_sequence, delay=1.5)
    
    return controller

def interactive_control():
    """Interactive servo control via REPL"""
    print("=== Interactive Servo Control ===")
    print("Commands:")
    print("  angle <degrees>     - Move to angle (0-180)")
    print("  smooth <degrees>    - Smooth move to angle")
    print("  sweep <min> <max>   - Sweep between angles")
    print("  calibrate          - Run calibration")
    print("  quit               - Exit interactive mode")
    
    servo = ServoMotor(2)  # Adjust pin as needed
    
    while True:
        try:
            cmd = input("servo> ").strip().split()
            
            if not cmd:
                continue
            elif cmd[0] == 'quit':
                break
            elif cmd[0] == 'angle' and len(cmd) == 2:
                servo.angle(int(cmd[1]))
            elif cmd[0] == 'smooth' and len(cmd) == 2:
                servo.smooth_move(int(cmd[1]))
            elif cmd[0] == 'sweep' and len(cmd) == 3:
                servo.sweep(int(cmd[1]), int(cmd[2]), cycles=2)
            elif cmd[0] == 'calibrate':
                servo.calibrate()
            else:
                print("Invalid command or arguments")
                
        except ValueError:
            print("Invalid number format")
        except KeyboardInterrupt:
            break
    
    servo.deinit()

# Main execution
if __name__ == "__main__":
    print("🤖 MicroPython Servo Motor Controller")
    print("=" * 40)
    
    try:
        # Uncomment the demo you want to run:
        
        # Single servo demo
        servo = demo_single_servo()
        
        # Multi-servo demo
        # controller = demo_multi_servo()
        
        # Interactive control
        # interactive_control()
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Demo complete!")