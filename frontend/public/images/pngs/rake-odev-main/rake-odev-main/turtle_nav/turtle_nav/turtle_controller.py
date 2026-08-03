#!/usr/bin/env python3
import sys
import math
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from turtlesim.msg import Pose
from turtlesim.srv import Spawn, Kill

class TurtleController(Node):
    def __init__(self):
        super().__init__('turtle_controller')
        
        # --- 1. PARAMETRE VE GÜVENLİK ---
        self.declare_parameter('coordinates', [0.0, 0.0])
        self.coords = self.get_parameter('coordinates').value
        
        if not self.validate_coordinates():
            self.get_logger().error("Koordinatlar hatalı! Uygulama sonlandırılıyor.")
            sys.exit(1)
            
        self.targets_x = self.coords[0::2]
        self.targets_y = self.coords[1::2]
        
        # --- 2. SERVİSLER ---
        self.spawn_client = self.create_client(Spawn, 'spawn')
        self.kill_client = self.create_client(Kill, 'kill')
        
        while not self.spawn_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Spawn servisi bekleniyor...')
            
        # --- 3. HAREKET VE KONTROL AYARLARI ---
        self.velocity_publisher = self.create_publisher(Twist, '/turtle1/cmd_vel', 10)
        self.pose_subscriber = self.create_subscription(Pose, '/turtle1/pose', self.update_pose, 10)
        self.pose = Pose()
        
        self.current_target_index = 0
        self.kp_linear = 1.5
        self.kp_angular = 6.0
        self.distance_tolerance = 0.1
        
        # OYUN BAŞLARKEN SADECE İLK HEDEFİ YARAT
        self.spawn_single_target()
        
        self.timer = self.create_timer(0.1, self.control_loop)

    def validate_coordinates(self):
        if not self.coords or len(self.coords) % 2 != 0:
            return False
        for val in self.coords:
            if type(val) not in [int, float] or val < 0.0 or val > 11.0:
                return False
        return True

    def spawn_single_target(self):
        """Sadece sırası gelen tek bir hedefi haritaya ekler."""
        if self.current_target_index < len(self.targets_x):
            req = Spawn.Request()
            req.x = float(self.targets_x[self.current_target_index])
            req.y = float(self.targets_y[self.current_target_index])
            req.theta = 0.0
            req.name = f'target_turtle_{self.current_target_index+1}'
            self.spawn_client.call_async(req)

    def update_pose(self, data):
        self.pose = data

    def control_loop(self):
        if self.current_target_index < len(self.targets_x):
            goal_x = self.targets_x[self.current_target_index]
            goal_y = self.targets_y[self.current_target_index]
            
            distance = math.sqrt((goal_x - self.pose.x)**2 + (goal_y - self.pose.y)**2)
            
            msg = Twist()
            if distance >= self.distance_tolerance:
                msg.linear.x = self.kp_linear * distance
                desired_angle = math.atan2(goal_y - self.pose.y, goal_x - self.pose.x)
                angle_error = desired_angle - self.pose.theta
                angle_error = math.atan2(math.sin(angle_error), math.cos(angle_error))
                
                msg.angular.z = self.kp_angular * angle_error
                self.velocity_publisher.publish(msg)
            else:
                msg.linear.x = 0.0
                msg.angular.z = 0.0
                self.velocity_publisher.publish(msg)
                
                target_name = f'target_turtle_{self.current_target_index+1}'
                self.get_logger().info(f'{target_name} YAKALANDI!')
                
                kill_req = Kill.Request()
                kill_req.name = target_name
                self.kill_client.call_async(kill_req)
                
                self.current_target_index += 1
                
                # ESKİ HEDEF YAKALANDIĞI İÇİN ŞİMDİ YENİSİNİ YARAT
                self.spawn_single_target()
        else:
            self.get_logger().info('TÜM HEDEFLER YAKALANDI! Görev başarıyla tamamlandı.')
            self.timer.cancel()

def main(args=None):
    rclpy.init(args=args)
    node = TurtleController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
