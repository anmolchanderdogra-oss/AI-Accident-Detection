"""
Sample Road Video Generator for Testing
Generates a 5-second simulated road video with vehicles and a collision event.
Used to immediately test the Video Upload Detection pipeline.
"""
import os
import cv2
import numpy as np

def generate_sample_road_video(output_path="sample_traffic_crash.mp4", duration_sec=5, fps=25):
    width, height = 640, 480
    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Car 1 (Teal) moving right
    c1_x, c1_y = 60, 240
    # Car 2 (Gold) moving left
    c2_x, c2_y = 560, 245

    crash_frame = int(total_frames * 0.45)

    print(f"Generating simulated video '{output_path}' ({total_frames} frames)...")

    for f in range(total_frames):
        # Road asphalt background
        frame = np.full((height, width, 3), (35, 38, 38), dtype=np.uint8)

        # Grass borders
        frame[0:80, :] = (40, 90, 45)
        frame[400:480, :] = (40, 90, 45)

        # White lane lines
        offset = (f * 8) % 60
        for x in range(-60 + offset, width + 60, 60):
            cv2.line(frame, (x, 240), (x + 30, 240), (220, 220, 220), 3)

        if f < crash_frame:
            # Vehicles approaching
            c1_x += 4
            c2_x -= 4
            # Draw Car 1
            cv2.rectangle(frame, (c1_x, c1_y - 20), (c1_x + 50, c1_y + 20), (162, 168, 43), -1)
            # Draw Car 2
            cv2.rectangle(frame, (c2_x - 50, c2_y - 20), (c2_x, c2_y + 20), (63, 210, 255), -1)
        elif f < crash_frame + 28:
            # Collision impact! Violent motion shockwave & flashes
            jitter_x = np.random.randint(-25, 26)
            jitter_y = np.random.randint(-20, 21)

            # Debris & Impact Flash
            impact_radius = 40 + (f - crash_frame) * 4
            cv2.rectangle(frame, (c1_x + jitter_x, c1_y - 35 + jitter_y), (c1_x + 80 + jitter_x, c1_y + 35 + jitter_y), (74, 108, 239), -1)
            cv2.circle(frame, (c1_x + 35 + jitter_x, c1_y + jitter_y), min(120, impact_radius), (0, 240, 255), -1)
            cv2.circle(frame, (c1_x + 35 + jitter_x, c1_y + jitter_y), min(150, impact_radius + 20), (74, 108, 239), 4)

            # Particles / Debris
            for _ in range(16):
                px = c1_x + 35 + np.random.randint(-100, 101)
                py = c1_y + np.random.randint(-80, 81)
                cv2.circle(frame, (px, py), np.random.randint(3, 9), (255, 255, 255), -1)
        else:
            # Post-crash stationary disabled vehicles
            cv2.rectangle(frame, (c1_x - 5, c1_y - 25), (c1_x + 45, c1_y + 15), (74, 108, 239), -1)
            cv2.rectangle(frame, (c1_x + 15, c1_y - 15), (c1_x + 65, c1_y + 25), (63, 210, 255), -1)

            # Smoke plume
            for i in range(4):
                smk_y = c1_y - 30 - (i * 18) - (f % 10)
                smk_x = c1_x + 25 + np.random.randint(-15, 16)
                cv2.circle(frame, (smk_x, smk_y), 12 + i * 4, (120, 130, 130), -1)

        out.write(frame)

    out.release()
    print(f"Sample video created successfully at: {output_path}")
    return output_path

if __name__ == '__main__':
    generate_sample_road_video()
