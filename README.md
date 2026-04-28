# Smart BLE Attendance System

An automated attendance tracking system designed for university classrooms. This project utilizes an ESP32 microcontroller and Google Sheets to create a low-cost, serverless, and highly secure check-in flow that effectively prevents common proxy attendance methods.

## System Features

### Bluetooth Low Energy (BLE) Proximity Verification
Instead of using easily spoofed GPS coordinates or static QR codes, this system requires physical proximity. The ESP32 node acts as a BLE beacon. Students must use their smartphones to scan and connect to this node via the Web Bluetooth API. The system executes a dynamic challenge-response exchange to verify that the student is actually inside the classroom before allowing the check-in request to proceed.

### Strict Device Binding (Anti-Cheat Mechanism)
To prevent "buddy punching" (where one student logs into multiple accounts or shares their credentials), the system implements a strict 1-to-1 device binding rule. Upon the first successful check-in, the frontend generates a unique hardware identifier (UUID) stored in LocalStorage. The backend permanently maps this UUID to the student's ID in the Google Sheets database. Any subsequent check-in attempts for that student ID from a different device will be automatically rejected.

### Offline Caching and Background Synchronization
University Wi-Fi networks and cellular data can be unstable inside crowded lecture halls. To handle this, the client application is built as a Progressive Web App (PWA). If a network request times out after a successful BLE verification, the payload is safely cached in the device's LocalStorage. Once the browser detects a stable internet connection, it automatically syncs the cached data to the Google Sheets backend without requiring manual intervention from the student.

### Secure Self-Service Password Reset
Managing forgotten passwords for hundreds of students can be time-consuming for instructors. This system allows students to reset their own passwords instantly. However, for security purposes, the backend will only accept the password reset payload if it originates from the specific device UUID that was originally bound to the student's account.

### Instructor Dashboard and Analytics
A dedicated web interface for instructors to monitor attendance data in real-time. The dashboard reads directly from Google Sheets but utilizes Google Apps Script CacheService to minimize read latency and avoid API rate limits. Instructors can filter data by class and date, force a manual cache sync, and export the attendance records directly to an .xlsx file for reporting.

## Technical Stack

### Hardware
* Microcontroller: ESP32
* Language: C++ (Arduino Core)
* Communication: Bluetooth Low Energy (BLE) with hardware watchdog timers to ensure continuous operation.

### Frontend
* Core: HTML5, CSS3, Vanilla JavaScript
* APIs: Web Bluetooth API, Service Workers, LocalStorage
* Architecture: Progressive Web App (PWA)

### Backend & Database
* Infrastructure: Google Apps Script (Serverless RESTful API)
* Database: Google Sheets (Used for storing user credentials, device mappings, and daily attendance logs)
* Optimization: CacheService for O(1) data retrieval.

### Libraries
* SweetAlert2: For custom, non-blocking UI notifications.
* SheetJS: For client-side generation and downloading of Excel files.
