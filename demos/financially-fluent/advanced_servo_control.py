"""
Advanced Servo Motor Control Examples
====================================

This file contains advanced servo motor interfacing techniques for various scenarios:
1. PCA9685 16-channel PWM driver control
2. PID-controlled servo positioning
3. Multi-axis robotic arm control
4. Servo feedback and position sensing
5. Real-time servo choreography

Requirements:
- For PCA9685: pip install adafruit-circuitpython-pca9685
- For advanced features: pip install numpy matplotlib (optional)
"""

import time
import math
import threading
from collections import deque

# For PCA9685 PWM driver (Adafruit library)
try:
    import board
    import busio
    from adafruit_pca9685 import PCA9685
    from adafruit_motor import servo
    PCA9685_AVAILABLE = True
except ImportError:
    PCA9685_AVAILABLE = False
    print("PCA9685 library not available. Install with: pip install adafruit-circuitpython-pca9685")

class AdvancedServoController:
    """
    Advanced servo controller with PID control and trajectory planning
    """
    
    def __init__(self, pin_or_channel, use_pca9685=False, pca9685_board=None):
        """
        Initialize advanced servo controller
        
        Args:
            pin_or_channel: GPIO pin number or PCA9685 channel
            use_pca9685: Whether to use PCA9685 PWM driver
            pca9685_board: PCA9685 board instance
        """
        self.use_pca9685 = use_pca9685 and PCA9685_AVAILABLE
        self.pin_or_channel = pin_or_channel
        self.current_angle = 90.0
        self.target_angle = 90.0
        self.velocity = 0.0
        self.acceleration = 0.0
        
        # PID controller parameters
        self.kp = 2.0  # Proportional gain
        self.ki = 0.1  # Integral gain  
        self.kd = 0.05 # Derivative gain
        self.pid_integral = 0.0
        self.pid_last_error = 0.0
        
        # Motion constraints
        self.max_velocity = 180.0  # degrees per second
        self.max_acceleration = 360.0  # degrees per second squared
        
        # Position history for smoothing
        self.position_history = deque(maxlen=10)
        
        # Initialize servo hardware
        if self.use_pca9685:
            self.servo = servo.Servo(pca9685_board.channels[pin_or_channel])
        else:
            # Fallback to basic PWM (implementation depends on platform)
            print(f"Using basic PWM on pin/channel {pin_or_channel}")
            
        self.move_to_angle(90)  # Center position
        
    def move_to_angle(self, angle, use_pid=False):
        """
        Move servo to target angle with optional PID control
        
        Args:
            angle: Target angle (0-180 degrees)
            use_pid: Whether to use PID control for positioning
        """
        angle = max(0, min(180, angle))
        self.target_angle = angle
        
        if use_pid:
            self._pid_move_to_angle()
        else:
            self._direct_move_to_angle(angle)
    
    def _direct_move_to_angle(self, angle):
        """Direct servo movement without PID"""
        if self.use_pca9685:
            self.servo.angle = angle
        else:
            # Implement basic PWM control here
            pass
            
        self.current_angle = angle
        self.position_history.append(angle)
    
    def _pid_move_to_angle(self):
        """PID-controlled servo movement for precise positioning"""
        dt = 0.02  # 20ms update interval
        
        while abs(self.current_angle - self.target_angle) > 0.5:
            # Calculate error
            error = self.target_angle - self.current_angle
            
            # PID calculations
            self.pid_integral += error * dt
            derivative = (error - self.pid_last_error) / dt
            
            # PID output
            pid_output = (self.kp * error + 
                         self.ki * self.pid_integral + 
                         self.kd * derivative)
            
            # Apply constraints
            pid_output = max(-self.max_velocity * dt, 
                           min(self.max_velocity * dt, pid_output))
            
            # Update position
            new_angle = self.current_angle + pid_output
            new_angle = max(0, min(180, new_angle))
            
            self._direct_move_to_angle(new_angle)
            
            self.pid_last_error = error
            time.sleep(dt)
    
    def trajectory_move(self, target_angle, duration):
        """
        Move servo following a smooth trajectory over specified duration
        
        Args:
            target_angle: Target position
            duration: Movement duration in seconds
        """
        start_angle = self.current_angle
        start_time = time.time()
        
        while time.time() - start_time < duration:
            # Calculate progress (0 to 1)
            progress = (time.time() - start_time) / duration
            
            # Use smooth S-curve trajectory (sigmoid function)
            smooth_progress = self._smooth_step(progress)
            
            # Calculate current target angle
            current_target = start_angle + (target_angle - start_angle) * smooth_progress
            
            self._direct_move_to_angle(current_target)
            time.sleep(0.02)  # 50Hz update rate
        
        # Ensure we reach exact target
        self._direct_move_to_angle(target_angle)
    
    def _smooth_step(self, x):
        """Smooth step function for trajectory planning"""
        # Smoothstep function: 3x² - 2x³
        return x * x * (3 - 2 * x)
    
    def oscillate(self, center_angle, amplitude, frequency, duration):
        """
        Create oscillating motion around center point
        
        Args:
            center_angle: Center position for oscillation
            amplitude: Oscillation amplitude in degrees
            frequency: Oscillation frequency in Hz
            duration: Total duration in seconds
        """
        start_time = time.time()
        
        while time.time() - start_time < duration:
            elapsed = time.time() - start_time
            angle = center_angle + amplitude * math.sin(2 * math.pi * frequency * elapsed)
            angle = max(0, min(180, angle))
            
            self._direct_move_to_angle(angle)
            time.sleep(0.02)
    
    def get_smoothed_position(self):
        """Get smoothed position using moving average"""
        if len(self.position_history) == 0:
            return self.current_angle
        return sum(self.position_history) / len(self.position_history)

class RoboticArm:
    """
    Multi-axis robotic arm controller using multiple servos
    """
    
    def __init__(self, servo_pins_or_channels, use_pca9685=False):
        """
        Initialize robotic arm
        
        Args:
            servo_pins_or_channels: List of servo pins/channels [base, shoulder, elbow, wrist, gripper]
            use_pca9685: Whether to use PCA9685 PWM driver
        """
        self.servos = {}
        self.joint_names = ['base', 'shoulder', 'elbow', 'wrist', 'gripper']
        
        # Initialize PCA9685 if needed
        if use_pca9685 and PCA9685_AVAILABLE:
            i2c = busio.I2C(board.SCL, board.SDA)
            self.pca = PCA9685(i2c)
            self.pca.frequency = 50
        else:
            self.pca = None
        
        # Create servo controllers
        for i, (name, pin_channel) in enumerate(zip(self.joint_names, servo_pins_or_channels)):
            self.servos[name] = AdvancedServoController(
                pin_channel, 
                use_pca9685, 
                self.pca
            )
        
        # Define joint limits (min, max angles for each joint)
        self.joint_limits = {
            'base': (0, 180),
            'shoulder': (0, 180),
            'elbow': (0, 180), 
            'wrist': (0, 180),
            'gripper': (0, 180)
        }
        
        # Home position
        self.home_position = {
            'base': 90,
            'shoulder': 90,
            'elbow': 90,
            'wrist': 90,
            'gripper': 90
        }
        
        self.go_home()
    
    def go_home(self):
        """Move all joints to home position"""
        print("Moving to home position...")
        self.move_to_position(self.home_position)
    
    def move_to_position(self, position_dict, synchronized=True):
        """
        Move arm to specified joint positions
        
        Args:
            position_dict: Dictionary of joint angles {'joint_name': angle}
            synchronized: Whether to move all joints simultaneously
        """
        # Validate joint limits
        for joint_name, angle in position_dict.items():
            if joint_name in self.joint_limits:
                min_angle, max_angle = self.joint_limits[joint_name]
                angle = max(min_angle, min(max_angle, angle))
                position_dict[joint_name] = angle
        
        if synchronized:
            # Move all joints simultaneously using threads
            threads = []
            for joint_name, angle in position_dict.items():
                if joint_name in self.servos:
                    thread = threading.Thread(
                        target=self.servos[joint_name].trajectory_move,
                        args=(angle, 2.0)  # 2 second movement
                    )
                    threads.append(thread)
                    thread.start()
            
            # Wait for all movements to complete
            for thread in threads:
                thread.join()
        else:
            # Move joints sequentially
            for joint_name, angle in position_dict.items():
                if joint_name in self.servos:
                    self.servos[joint_name].move_to_angle(angle)
                    time.sleep(1)
    
    def perform_pick_and_place(self, pickup_pos, place_pos):
        """
        Perform pick and place operation
        
        Args:
            pickup_pos: Dictionary of joint angles for pickup position
            place_pos: Dictionary of joint angles for place position
        """
        print("Starting pick and place sequence...")
        
        # 1. Move to pickup position
        print("Moving to pickup position...")
        pickup_pos['gripper'] = 180  # Open gripper
        self.move_to_position(pickup_pos)
        
        # 2. Close gripper to pick up object
        print("Closing gripper...")
        self.servos['gripper'].move_to_angle(90)  # Close gripper
        time.sleep(1)
        
        # 3. Lift object slightly
        print("Lifting object...")
        pickup_pos['shoulder'] -= 10  # Lift shoulder slightly
        self.move_to_position(pickup_pos)
        
        # 4. Move to intermediate position (avoid obstacles)
        print("Moving to intermediate position...")
        intermediate_pos = self.home_position.copy()
        intermediate_pos['gripper'] = 90  # Keep gripper closed
        self.move_to_position(intermediate_pos)
        
        # 5. Move to place position
        print("Moving to place position...")
        place_pos['gripper'] = 90  # Keep gripper closed
        self.move_to_position(place_pos)
        
        # 6. Open gripper to release object
        print("Releasing object...")
        self.servos['gripper'].move_to_angle(180)  # Open gripper
        time.sleep(1)
        
        # 7. Return to home position
        print("Returning home...")
        self.go_home()
        
        print("Pick and place complete!")
    
    def wave_gesture(self, cycles=3):
        """Perform a waving gesture"""
        print(f"Performing wave gesture ({cycles} cycles)...")
        
        wave_positions = [
            {'base': 45, 'shoulder': 45, 'elbow': 45, 'wrist': 90},
            {'base': 45, 'shoulder': 45, 'elbow': 90, 'wrist': 45},
            {'base': 45, 'shoulder': 45, 'elbow': 45, 'wrist': 135},
            {'base': 45, 'shoulder': 45, 'elbow': 90, 'wrist': 45}
        ]
        
        for cycle in range(cycles):
            for position in wave_positions:
                self.move_to_position(position)
                time.sleep(0.5)
        
        self.go_home()
    
    def get_current_position(self):
        """Get current position of all joints"""
        position = {}
        for joint_name, servo in self.servos.items():
            position[joint_name] = servo.current_angle
        return position
    
    def emergency_stop(self):
        """Emergency stop - freeze all joints at current position"""
        print("EMERGENCY STOP!")
        current_pos = self.get_current_position()
        self.move_to_position(current_pos, synchronized=False)

class ServoChoreographer:
    """
    Create and execute complex servo choreography sequences
    """
    
    def __init__(self, servos_dict):
        """
        Initialize choreographer
        
        Args:
            servos_dict: Dictionary of servo controllers {'name': ServoController}
        """
        self.servos = servos_dict
        self.sequences = {}
    
    def add_sequence(self, name, keyframes, timing):
        """
        Add a choreography sequence
        
        Args:
            name: Sequence name
            keyframes: List of position dictionaries
            timing: List of timing values for each keyframe
        """
        if len(keyframes) != len(timing):
            raise ValueError("Keyframes and timing lists must have same length")
        
        self.sequences[name] = {
            'keyframes': keyframes,
            'timing': timing
        }
        
        print(f"Added sequence '{name}' with {len(keyframes)} keyframes")
    
    def play_sequence(self, name, speed_multiplier=1.0):
        """
        Play a choreography sequence
        
        Args:
            name: Sequence name to play
            speed_multiplier: Speed adjustment (1.0 = normal, 2.0 = 2x speed)
        """
        if name not in self.sequences:
            print(f"Sequence '{name}' not found")
            return
        
        sequence = self.sequences[name]
        keyframes = sequence['keyframes']
        timing = sequence['timing']
        
        print(f"Playing sequence '{name}'...")
        
        for i, (keyframe, duration) in enumerate(zip(keyframes, timing)):
            print(f"Keyframe {i+1}/{len(keyframes)}")
            
            # Adjust duration by speed multiplier
            adjusted_duration = duration / speed_multiplier
            
            # Move all servos simultaneously
            threads = []
            for servo_name, angle in keyframe.items():
                if servo_name in self.servos:
                    thread = threading.Thread(
                        target=self.servos[servo_name].trajectory_move,
                        args=(angle, adjusted_duration)
                    )
                    threads.append(thread)
                    thread.start()
            
            # Wait for all movements to complete
            for thread in threads:
                thread.join()
        
        print(f"Sequence '{name}' complete!")

# Example usage and demo functions
def demo_advanced_servo():
    """Demonstrate advanced servo features"""
    print("=== Advanced Servo Demo ===")
    
    # This is a conceptual demo - adjust pins for your hardware
    if PCA9685_AVAILABLE:
        print("Using PCA9685 PWM driver")
        servo = AdvancedServoController(0, use_pca9685=True)
    else:
        print("Using basic servo control")
        servo = AdvancedServoController(9, use_pca9685=False)
    
    # Test PID control
    print("Testing PID-controlled movement...")
    servo.move_to_angle(45, use_pid=True)
    time.sleep(2)
    
    # Test trajectory movement
    print("Testing smooth trajectory...")
    servo.trajectory_move(135, 3.0)
    
    # Test oscillation
    print("Testing oscillation...")
    servo.oscillate(90, 30, 0.5, 5.0)  # 30° amplitude, 0.5Hz, 5 seconds
    
    return servo

def demo_robotic_arm():
    """Demonstrate robotic arm control"""
    print("=== Robotic Arm Demo ===")
    
    # Create robotic arm (adjust pins for your hardware)
    arm_pins = [0, 1, 2, 3, 4]  # PCA9685 channels or GPIO pins
    arm = RoboticArm(arm_pins, use_pca9685=PCA9685_AVAILABLE)
    
    # Test basic movements
    test_position = {
        'base': 45,
        'shoulder': 60,
        'elbow': 120,
        'wrist': 90,
        'gripper': 90
    }
    
    print("Moving to test position...")
    arm.move_to_position(test_position)
    time.sleep(2)
    
    # Test wave gesture
    arm.wave_gesture(2)
    
    # Test pick and place
    pickup_pos = {'base': 45, 'shoulder': 120, 'elbow': 60, 'wrist': 90}
    place_pos = {'base': 135, 'shoulder': 120, 'elbow': 60, 'wrist': 90}
    
    arm.perform_pick_and_place(pickup_pos, place_pos)
    
    return arm

if __name__ == "__main__":
    print("🤖 Advanced Servo Motor Control Demo")
    print("=" * 50)
    
    # Uncomment the demo you want to run:
    # demo_advanced_servo()
    # demo_robotic_arm()
    
    print("Demo complete! Check the code for more examples.")