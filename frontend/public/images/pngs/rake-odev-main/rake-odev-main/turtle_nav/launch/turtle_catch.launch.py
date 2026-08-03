import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # Dışarıdan alınacak 'coordinates' argümanını tanımlıyoruz
    coordinates_arg = DeclareLaunchArgument(
        'coordinates',
        default_value='[2.0, 2.0, 8.0, 8.0]', # Eğer argüman girilmezse varsayılan hedefler
        description='Yakalancak hedeflerin x ve y koordinat listesi'
    )

    # 1. Düğüm: Turtlesim'in kendi mavi ekranı
    turtlesim_node = Node(
        package='turtlesim',
        executable='turtlesim_node',
        name='sim'
    )

    # 2. Düğüm: Bizim yazdığımız avcı kontrolcü kodumuz
    controller_node = Node(
        package='turtle_nav',
        executable='turtle_controller',
        name='turtle_controller',
        parameters=[{
            'coordinates': LaunchConfiguration('coordinates')
        }]
    )

    # Her şeyi tek bir çatı altında toplayıp çalıştırıyoruz
    return LaunchDescription([
        coordinates_arg,
        turtlesim_node,
        controller_node
    ])
