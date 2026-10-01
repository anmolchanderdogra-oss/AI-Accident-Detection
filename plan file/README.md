# AI-Based Accident Detection and Emergency Alert System — Project Documentation

This package contains the six planning documents required before coding:

1. PRD — what the product must do
2. TRD — how the system will technically work
3. App Flow — where each user action goes
4. UI/UX Design Brief — interface and supplied Flip7-inspired design system
5. Backend Schema — database entities and relationships
6. Implementation Plan — coding phases and project structure

The system is intentionally designed **without IoT hardware**. It uses Computer Vision, Deep Learning, OpenCV, Flask, browser location services, and optional communication APIs.

Recommended first MVP:
**Upload Video → OpenCV → AI Model → Temporal Detection → Evidence → Incident DB → Dashboard Alert**
