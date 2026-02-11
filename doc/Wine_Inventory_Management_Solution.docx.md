# Wine Inventory Management System

Comprehensive Technical Solution Document

Client: Wine Restaurant

Document Date: February 2026

Version: 1.0

# **Table of Contents**

1. 1\. Executive Summary  
2. 2\. System Overview  
3. 3\. Technical Architecture  
4. 4\. Feature Specifications  
5. 5\. Technology Stack  
6. 6\. AI Integration Details  
7. 7\. Database Design  
8. 8\. API Specifications  
9. 9\. Security & Authentication  
10. 10\. UI/UX Design Guidelines  
11. 11\. Mobile Responsiveness  
12. 12\. Implementation Timeline  
13. 13\. Cost Estimation  
14. 14\. Maintenance & Support  
15. 15\. Appendices

# **1\. Executive Summary**

This document outlines a comprehensive web-based wine inventory management system designed specifically for a wine restaurant managing over 200 different bottle varieties. The solution leverages cutting-edge AI technologies including barcode scanning and image recognition to streamline inventory processes, reduce manual data entry errors, and improve operational efficiency.

## **Key Objectives**

* Reduce inventory counting time by 70% through automated recognition  
* Minimize human error in stock counting and data entry  
* Provide real-time inventory visibility to management  
* Enable mobile-first inventory management for staff  
* Implement comprehensive audit trails for compliance  
* Integrate AI-powered wine bottle recognition via image and barcode

## **Expected Benefits**

* Instant bottle identification using smartphone camera  
* Automated data entry reducing manual work by 80%  
* Complete inventory history and analytics  
* Multi-user support with role-based access  
* Integration-ready architecture for future POS systems  
* Scalable cloud-based infrastructure

# **2\. System Overview**

The Wine Inventory Management System is a Progressive Web Application (PWA) that enables restaurant staff to conduct inventory counts using mobile devices with advanced AI capabilities for bottle recognition.

## **System Architecture Diagram**

The system follows a modern three-tier architecture:

* Presentation Layer: React-based responsive web interface  
* Application Layer: Node.js/Express REST API with business logic  
* Data Layer: PostgreSQL database with Redis caching  
* AI Services Layer: Image recognition and barcode scanning modules

## **User Workflow**

1\. Staff member logs into the system via mobile device

2\. Selects inventory mode (Manual Search or Camera-Based)

3\. For Camera Mode: Captures bottle via barcode or image recognition

4\. System identifies wine using AI (Vivino-like recognition)

5\. Displays wine details with quantity input field

6\. Staff confirms and submits inventory count

7\. System logs all actions and updates database in real-time

# **3\. Technical Architecture**

## **System Components**

| Component | Technology | Purpose |
| :---- | :---- | :---- |
| **Frontend** | React 18 \+ TypeScript | User interface and client-side logic |
| **Backend API** | Node.js \+ Express | REST API and business logic |
| **Database** | PostgreSQL 15 | Primary data storage |
| **Cache Layer** | Redis | Session management and caching |
| **Image Recognition** | TensorFlow.js \+ Custom API | Wine bottle identification |
| **Barcode Scanner** | ZXing / QuaggaJS | Barcode reading and processing |
| **File Storage** | AWS S3 / Cloudinary | Image storage for bottle photos |
| **Authentication** | JWT \+ bcrypt | Secure user authentication |
| **Deployment** | Docker \+ AWS/GCP | Containerized cloud deployment |
| **Monitoring** | Sentry \+ LogRocket | Error tracking and analytics |

## **Microservices Architecture**

The system will be built using a microservices approach for scalability:

* Authentication Service: User login, session management, JWT token generation  
* Inventory Service: Stock management, CRUD operations for bottles  
* Recognition Service: AI-based image and barcode recognition  
* Analytics Service: Reporting, data aggregation, insights  
* Notification Service: Alerts for low stock, expiry dates

# **4\. Feature Specifications**

## **4.1 User Authentication**

* Email/username and password login  
* Role-based access control (Admin, Manager, Staff)  
* Session timeout after 30 minutes of inactivity  
* Password requirements: minimum 8 characters, uppercase, lowercase, number  
* Two-factor authentication (optional for admin users)  
* Account lockout after 5 failed login attempts

## **4.2 Manual Inventory Entry**

Traditional inventory method with enhanced search capabilities:

* Fast text search with autocomplete (search by name, vintage, region, producer)  
* Filter options: wine type, region, vintage range, price range  
* Recently counted items appear at top for quick access  
* Bulk entry mode for counting multiple bottles of same wine  
* Quick view of wine details without leaving search screen  
* Keyboard shortcuts for power users

## **4.3 Camera-Based Inventory (Barcode)**

* Support for UPC, EAN-13, EAN-8, Code 128 barcode formats  
* Auto-focus and auto-capture when barcode detected  
* Flashlight toggle for low-light environments  
* Fallback to manual barcode entry if camera fails  
* Barcode validation against wine database  
* Option to add new wines by barcode if not in database

## **4.4 Camera-Based Inventory (Image Recognition)**

AI-powered wine bottle recognition similar to Vivino app:

* Label detection and extraction from bottle photos  
* Text recognition (OCR) for wine name, vintage, producer  
* Visual similarity matching against wine database  
* Confidence score display (e.g., 95% match)  
* Multiple match results if confidence is low  
* User confirmation required before adding to inventory  
* Ability to capture and save new bottle images for future recognition  
* Works with partially visible labels (minimum 60% of label visible)

## **4.5 Inventory Counting Interface**

* Large, touch-friendly quantity input field  
* Plus/minus buttons for quick increment/decrement  
* Voice input support for hands-free counting  
* Display of previous count date and quantity  
* Notes field for condition remarks (e.g., damaged label, low fill)  
* Photo upload option for documentation  
* Undo last entry button  
* Running total count displayed at bottom of screen

## **4.6 Wine Database Management**

* Complete wine catalog with 200+ bottles pre-loaded  
* Wine attributes: name, producer, region, vintage, type, price, location  
* Storage location tracking (cellar section, rack, position)  
* Par levels and reorder points  
* Supplier information and purchase history  
* Tasting notes and pairing suggestions  
* Image gallery for each wine (label, bottle)  
* Import/export functionality (CSV, Excel)  
* Bulk update capabilities for pricing, locations

## **4.7 Reporting & Analytics**

* Real-time inventory dashboard with key metrics  
* Inventory variance reports (expected vs actual)  
* Low stock alerts and reorder recommendations  
* Inventory value calculations  
* Historical inventory trends and charts  
* User activity logs and audit trails  
* Export reports to PDF, Excel, CSV  
* Scheduled email reports to management  
* Custom report builder with filters

## **4.8 Admin Features**

* User management (create, edit, delete, suspend accounts)  
* Role and permission assignment  
* System configuration and settings  
* Database backup and restore  
* Audit log viewer with search and filters  
* Integration settings for third-party APIs  
* Bulk import wine catalog from spreadsheet  
* System health monitoring dashboard

# **5\. Technology Stack**

## **Frontend Technologies**

| Technology | Version | Purpose |
| :---- | :---- | :---- |
| **React** | 18.2+ | UI framework |
| **TypeScript** | 5.0+ | Type safety and better DX |
| **Vite** | 4.0+ | Build tool and dev server |
| **Tailwind CSS** | 3.3+ | Utility-first styling |
| **React Query** | 4.0+ | Server state management |
| **Zustand** | 4.0+ | Client state management |
| **React Router** | 6.0+ | Client-side routing |
| **React Hook Form** | 7.0+ | Form validation |
| **Zod** | 3.0+ | Schema validation |
| **Axios** | 1.4+ | HTTP client |
| **QuaggaJS** | 0.12+ | Barcode scanning library |
| **TensorFlow.js** | 4.0+ | Client-side ML inference |
| **React Webcam** | 7.0+ | Camera access component |
| **Chart.js** | 4.0+ | Data visualization |
| **date-fns** | 2.30+ | Date manipulation |

## **Backend Technologies**

| Technology | Version | Purpose |
| :---- | :---- | :---- |
| **Node.js** | 20 LTS | JavaScript runtime |
| **Express.js** | 4.18+ | Web application framework |
| **TypeScript** | 5.0+ | Type safety |
| **PostgreSQL** | 15+ | Relational database |
| **Prisma** | 5.0+ | Database ORM |
| **Redis** | 7.0+ | Caching and session store |
| **JWT** | 9.0+ | Authentication tokens |
| **bcrypt** | 5.1+ | Password hashing |
| **Multer** | 1.4+ | File upload handling |
| **Sharp** | 0.32+ | Image processing |
| **Winston** | 3.10+ | Logging |
| **Jest** | 29.0+ | Testing framework |
| **Supertest** | 6.3+ | API testing |
| **Helmet** | 7.0+ | Security headers |
| **Express Rate Limit** | 6.0+ | Rate limiting |

## **AI & ML Technologies**

| Service/Library | Purpose |
| :---- | :---- |
| **Google Cloud Vision API** | Primary image recognition and OCR |
| **AWS Rekognition (Alternative)** | Backup image recognition service |
| **TensorFlow.js** | Client-side image classification |
| **MobileNet v2** | Pre-trained model for wine bottle detection |
| **Custom CNN Model** | Fine-tuned model for wine label recognition |
| **Tesseract.js** | Fallback OCR for text extraction |
| **Python Flask API** | ML model serving endpoint |

## **Infrastructure & DevOps**

* Docker & Docker Compose: Containerization  
* AWS ECS / Google Cloud Run: Container orchestration  
* AWS RDS / Cloud SQL: Managed PostgreSQL hosting  
* AWS ElastiCache / Memorystore: Managed Redis  
* AWS S3 / Google Cloud Storage: File storage  
* Cloudflare: CDN and DDoS protection  
* GitHub Actions: CI/CD pipelines  
* Terraform: Infrastructure as Code  
* Sentry: Error tracking and monitoring  
* LogRocket: Session replay and debugging  
* DataDog / New Relic: Application performance monitoring

# **6\. AI Integration Details**

## **6.1 Barcode Recognition System**

Technical Implementation:

* Library: QuaggaJS for web-based barcode scanning  
* Supported formats: UPC-A, UPC-E, EAN-8, EAN-13, Code 128, Code 39  
* Real-time camera feed processing at 15 FPS  
* Auto-focus optimization for mobile cameras  
* Confidence threshold: 90% minimum for auto-acceptance  
* Fallback to manual entry if scan fails after 10 seconds  
* Barcode cache: Store successful scans for faster future lookups

Integration Flow:

1\. User activates barcode scanner mode

2\. Camera stream initialized with constraints (1280x720, rear camera)

3\. QuaggaJS processes each frame to detect barcode patterns

4\. When barcode detected, extract numeric/alphanumeric code

5\. Send code to backend API endpoint: POST /api/v1/wines/search-by-barcode

6\. Backend queries PostgreSQL wine database for matching UPC/EAN

7\. Return wine details to frontend with 200ms average response time

8\. Display wine information with quantity input overlay

## **6.2 Image Recognition System**

The image recognition system uses a hybrid approach combining cloud AI services and custom machine learning models:

### **Architecture Overview**

* Layer 1: Client-side preprocessing (TensorFlow.js)  
* Layer 2: Cloud-based OCR and label detection (Google Cloud Vision)  
* Layer 3: Custom wine label classification model  
* Layer 4: Visual similarity matching against database  
* Layer 5: Fuzzy text matching for producer/wine names

### **Detailed Workflow**

1\. User captures bottle image using smartphone camera (recommended: well-lit environment, label centered)

2\. Client-side image preprocessing: Resize to 800x800px, normalize lighting, detect label region

3\. Upload compressed image to backend API: POST /api/v1/wines/recognize-image

4\. Backend sends image to Google Cloud Vision API for label detection and OCR

5\. Extract text elements: wine name, producer, vintage, region, grape variety

6\. Send extracted features to custom classification model (Flask ML API)

7\. Model returns top 5 candidate wines with confidence scores

8\. For each candidate, calculate visual similarity score using image embeddings

9\. Apply text fuzzy matching on extracted text vs database records

10\. Combine scores: 50% visual similarity \+ 30% text match \+ 20% classification confidence

11\. Return ranked results to frontend (threshold: 60% combined confidence)

12\. If confidence \< 60%, show "No confident match" with option to search manually

13\. User selects correct wine from results or indicates "not found"

14\. System stores feedback to improve model accuracy over time

### **Google Cloud Vision API Configuration**

* Feature: LABEL\_DETECTION (identify bottle objects)  
* Feature: TEXT\_DETECTION (OCR for wine label text)  
* Feature: IMAGE\_PROPERTIES (dominant colors for visual matching)  
* Max results: 10 labels, 50 text annotations  
* Language hints: en, fr, it, es (common wine label languages)  
* API quota: 1,000 requests/month free tier, then pay-as-you-go  
* Expected cost: \~$0.50 per 1,000 images processed

### **Custom ML Model Specifications**

A custom Convolutional Neural Network (CNN) trained specifically for wine bottle recognition:

* Model architecture: MobileNetV2 base \+ custom classification head  
* Input size: 224x224x3 (RGB images)  
* Output: 200 classes (one per wine in catalog) \+ "Unknown" class  
* Training dataset: 50 images per wine × 200 wines \= 10,000 training images  
* Data augmentation: rotation, flip, brightness, zoom  
* Training framework: TensorFlow 2.x with Keras API  
* Model format: TensorFlow Saved Model (.pb) for serving  
* Inference API: Python Flask app with TensorFlow Serving  
* Expected accuracy: 85-90% top-1, 95%+ top-5  
* Inference time: \<200ms per image on CPU, \<50ms on GPU

### **Fallback & Error Handling**

* If Google Cloud Vision API fails: Use Tesseract.js for OCR  
* If custom model unavailable: Fall back to pure text matching  
* If no internet: Show offline mode message, queue requests  
* If image quality poor: Prompt user to retake with better lighting  
* If multiple matches with similar scores: Show all options to user  
* If no match found: Offer manual search with extracted text pre-filled

## **6.3 Performance Optimization**

* Image compression before upload: JPEG quality 85%, max 1MB file size  
* Caching: Store recognition results in Redis for 24 hours  
* Batch processing: Queue images during high-volume inventory counts  
* CDN delivery: Serve wine images from CloudFront/Cloud CDN  
* Lazy loading: Load wine details only when viewing, not during search  
* Debouncing: Wait 300ms after camera stabilizes before processing  
* Progressive enhancement: Show partial results as AI processes

# **7\. Database Design**

The database schema is designed for performance, data integrity, and comprehensive audit trails.

## **7.1 Entity Relationship Model**

Core entities and their relationships:

* Users: Authentication and authorization  
* Wines: Complete wine catalog with detailed attributes  
* InventoryCounts: Historical record of all inventory counts  
* InventoryItems: Individual count entries linking wines to counts  
* Locations: Physical storage locations within the restaurant  
* Suppliers: Wine supplier information  
* AuditLogs: Comprehensive system activity logging  
* Images: Wine bottle and label images  
* BarcodeMapping: Barcode to wine relationships  
* RecognitionCache: Cached AI recognition results

## **7.2 Schema Details**

### **Users Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| **id** | UUID | PRIMARY KEY | Unique user identifier |
| **email** | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| **username** | VARCHAR(100) | UNIQUE, NOT NULL | Display username |
| **password\_hash** | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| **role** | ENUM | NOT NULL | admin, manager, staff |
| **is\_active** | BOOLEAN | DEFAULT true | Account status |
| **last\_login** | TIMESTAMP | NULL | Last login timestamp |
| **failed\_login\_attempts** | INTEGER | DEFAULT 0 | Failed login counter |
| **created\_at** | TIMESTAMP | NOT NULL | Account creation date |
| **updated\_at** | TIMESTAMP | NOT NULL | Last update timestamp |

### **Wines Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| **id** | UUID | PRIMARY KEY | Unique wine identifier |
| **name** | VARCHAR(255) | NOT NULL | Wine name |
| **producer** | VARCHAR(255) | NOT NULL | Producer/winery name |
| **vintage** | INTEGER | NULL | Year produced |
| **region** | VARCHAR(255) | NULL | Wine region/appellation |
| **country** | VARCHAR(100) | NULL | Country of origin |
| **wine\_type** | ENUM | NOT NULL | red, white, rose, sparkling, fortified |
| **grape\_varieties** | TEXT | NULL | Grape composition (JSON array) |
| **abv** | DECIMAL(4,2) | NULL | Alcohol by volume percentage |
| **bottle\_size** | INTEGER | DEFAULT 750 | Bottle size in ml |
| **purchase\_price** | DECIMAL(10,2) | NULL | Cost per bottle |
| **selling\_price** | DECIMAL(10,2) | NULL | Menu price |
| **sku** | VARCHAR(100) | UNIQUE | Internal SKU code |
| **upc\_ean** | VARCHAR(20) | NULL | UPC or EAN barcode |
| **location\_id** | UUID | FOREIGN KEY | Storage location |
| **par\_level** | INTEGER | DEFAULT 0 | Minimum stock level |
| **reorder\_point** | INTEGER | DEFAULT 0 | Reorder trigger quantity |
| **supplier\_id** | UUID | FOREIGN KEY | Primary supplier |
| **tasting\_notes** | TEXT | NULL | Tasting notes and description |
| **food\_pairings** | TEXT | NULL | Recommended food pairings |
| **is\_active** | BOOLEAN | DEFAULT true | Active in catalog |
| **created\_at** | TIMESTAMP | NOT NULL | Record creation date |
| **updated\_at** | TIMESTAMP | NOT NULL | Last update timestamp |

### **InventoryCounts Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| **id** | UUID | PRIMARY KEY | Unique count session ID |
| **user\_id** | UUID | FOREIGN KEY | User who performed count |
| **count\_type** | ENUM | NOT NULL | full, partial, spot\_check |
| **status** | ENUM | DEFAULT in\_progress | in\_progress, completed, cancelled |
| **started\_at** | TIMESTAMP | NOT NULL | Count start time |
| **completed\_at** | TIMESTAMP | NULL | Count completion time |
| **total\_items** | INTEGER | DEFAULT 0 | Number of wines counted |
| **total\_bottles** | INTEGER | DEFAULT 0 | Total bottle quantity |
| **variance\_value** | DECIMAL(10,2) | NULL | Value variance vs expected |
| **notes** | TEXT | NULL | Count session notes |
| **created\_at** | TIMESTAMP | NOT NULL | Record creation |

### **InventoryItems Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| **id** | UUID | PRIMARY KEY | Unique item entry ID |
| **count\_id** | UUID | FOREIGN KEY | Parent count session |
| **wine\_id** | UUID | FOREIGN KEY | Wine being counted |
| **quantity** | INTEGER | NOT NULL | Counted quantity |
| **expected\_quantity** | INTEGER | NULL | Expected quantity (from system) |
| **variance** | INTEGER | NULL | Difference (quantity \- expected) |
| **recognition\_method** | ENUM | NULL | manual, barcode, image\_ai |
| **recognition\_confidence** | DECIMAL(5,2) | NULL | AI confidence score (0-100) |
| **condition\_notes** | TEXT | NULL | Condition remarks |
| **image\_id** | UUID | FOREIGN KEY | Attached photo |
| **created\_at** | TIMESTAMP | NOT NULL | Entry timestamp |

## **7.3 Indexes and Performance**

* wines: CREATE INDEX idx\_wines\_name ON wines(name)  
* wines: CREATE INDEX idx\_wines\_producer ON wines(producer)  
* wines: CREATE INDEX idx\_wines\_upc ON wines(upc\_ean)  
* wines: CREATE INDEX idx\_wines\_type\_region ON wines(wine\_type, region)  
* inventory\_items: CREATE INDEX idx\_items\_count\_id ON inventory\_items(count\_id)  
* inventory\_items: CREATE INDEX idx\_items\_wine\_id ON inventory\_items(wine\_id)  
* inventory\_counts: CREATE INDEX idx\_counts\_user\_date ON inventory\_counts(user\_id, started\_at DESC)  
* audit\_logs: CREATE INDEX idx\_audit\_user\_action ON audit\_logs(user\_id, action, created\_at DESC)  
* Full-text search: CREATE INDEX idx\_wines\_fulltext ON wines USING GIN(to\_tsvector('english', name || ' ' || producer))

## **7.4 Data Retention and Archival**

* Audit logs: Keep 2 years, then archive to cold storage  
* Inventory counts: Keep all historical data permanently  
* Images: Keep 1 year, then archive to Glacier/Coldline  
* Recognition cache: Expire after 7 days  
* Session data: Expire after 30 days of inactivity  
* Deleted records: Soft delete with deleted\_at timestamp, purge after 90 days

# **8\. API Specifications**

RESTful API design following OpenAPI 3.0 specification. All endpoints return JSON responses.

## **8.1 Base URL**

Production: https://api.wineventory.com/api/v1

Staging: https://staging-api.wineventory.com/api/v1

## **8.2 Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
| :---- | :---- | :---- | :---- |
| **POST** | /auth/login | User login, returns JWT token | No |
| **POST** | /auth/logout | Invalidate user session | Yes |
| **POST** | /auth/refresh | Refresh JWT token | Yes |
| **POST** | /auth/forgot-password | Send password reset email | No |
| **POST** | /auth/reset-password | Reset password with token | No |
| **GET** | /auth/me | Get current user profile | Yes |

## **8.3 Wine Catalog Endpoints**

| Method | Endpoint | Description | Auth Required |
| :---- | :---- | :---- | :---- |
| **GET** | /wines | List all wines with pagination | Yes |
| **GET** | /wines/search | Search wines by name, producer, etc. | Yes |
| **GET** | /wines/:id | Get wine details by ID | Yes |
| **POST** | /wines | Create new wine | Yes (Admin) |
| **PUT** | /wines/:id | Update wine details | Yes (Admin) |
| **DELETE** | /wines/:id | Soft delete wine | Yes (Admin) |
| **POST** | /wines/search-by-barcode | Find wine by barcode | Yes |
| **POST** | /wines/recognize-image | AI wine recognition from image | Yes |
| **GET** | /wines/:id/history | Get inventory history for wine | Yes |

## **8.4 Inventory Endpoints**

| Method | Endpoint | Description | Auth Required |
| :---- | :---- | :---- | :---- |
| **GET** | /inventory/counts | List inventory count sessions | Yes |
| **POST** | /inventory/counts | Start new count session | Yes |
| **GET** | /inventory/counts/:id | Get count session details | Yes |
| **PUT** | /inventory/counts/:id | Update count session | Yes |
| **POST** | /inventory/counts/:id/complete | Mark count as completed | Yes |
| **POST** | /inventory/items | Add item to count | Yes |
| **PUT** | /inventory/items/:id | Update inventory item | Yes |
| **DELETE** | /inventory/items/:id | Remove item from count | Yes |
| **GET** | /inventory/current | Get current stock levels | Yes |
| **GET** | /inventory/variance | Get variance report | Yes (Manager) |

## **8.5 Sample API Request/Response**

### **POST /api/v1/wines/recognize-image**

Request:

{  
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  
  "options": {  
    "maxResults": 5,  
    "minConfidence": 60  
  }  
}  
    

Response (200 OK):

{  
  "success": true,  
  "results": \[  
    {  
      "wineId": "550e8400-e29b-41d4-a716-446655440000",  
      "name": "Château Margaux 2015",  
      "producer": "Château Margaux",  
      "vintage": 2015,  
      "region": "Margaux, Bordeaux",  
      "confidence": 92.5,  
      "matchType": "visual\_similarity",  
      "imageUrl": "https://cdn.wineventory.com/wines/margaux-2015.jpg"  
    },  
    {  
      "wineId": "660e8400-e29b-41d4-a716-446655440001",  
      "name": "Château Margaux 2014",  
      "producer": "Château Margaux",  
      "vintage": 2014,  
      "region": "Margaux, Bordeaux",  
      "confidence": 78.3,  
      "matchType": "text\_ocr",  
      "imageUrl": "https://cdn.wineventory.com/wines/margaux-2014.jpg"  
    }  
  \],  
  "extractedText": \["Château", "Margaux", "2015", "Grand Vin"\],  
  "processingTime": 1.23  
}  
    

## **8.6 Error Handling**

Standard HTTP error codes with descriptive JSON responses:

* 400 Bad Request: Invalid request parameters  
* 401 Unauthorized: Missing or invalid JWT token  
* 403 Forbidden: Insufficient permissions  
* 404 Not Found: Resource not found  
* 422 Unprocessable Entity: Validation errors  
* 429 Too Many Requests: Rate limit exceeded  
* 500 Internal Server Error: Server-side error  
* 503 Service Unavailable: Service temporarily down

Error Response Format:

{  
  "success": false,  
  "error": {  
    "code": "VALIDATION\_ERROR",  
    "message": "Invalid input parameters",  
    "details": \[  
      {  
        "field": "quantity",  
        "message": "Quantity must be a positive integer"  
      }  
    \]  
  },  
  "timestamp": "2026-02-09T12:34:56Z"  
}  
    

## **8.7 Rate Limiting**

* Anonymous requests: 20 requests/minute  
* Authenticated users: 100 requests/minute  
* Admin users: 500 requests/minute  
* Image recognition endpoint: 30 requests/minute per user  
* Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

# **9\. Security & Authentication**

## **9.1 Authentication Strategy**

The system uses JWT (JSON Web Tokens) for stateless authentication with Redis-backed token blacklisting.

* Access tokens: 15-minute expiration, contains user ID and role  
* Refresh tokens: 7-day expiration, stored in httpOnly cookies  
* Token rotation: New access token issued on each refresh  
* Token blacklist: Redis set for logout/revoked tokens  
* Password policy: Min 8 chars, uppercase, lowercase, number, special char  
* Password hashing: bcrypt with salt rounds \= 12  
* Session management: Redis store with 30-minute idle timeout

## **9.2 Authorization (RBAC)**

Role-based access control with three user roles:

| Role | Permissions | Description |
| :---- | :---- | :---- |
| **Staff** | Perform inventory counts, view wine catalog, add count entries | Basic inventory workers |
| **Manager** | All Staff permissions \+ view reports, export data, manage inventory sessions | Supervisors and managers |
| **Admin** | All Manager permissions \+ user management, system config, wine catalog CRUD | System administrators |

## **9.3 Data Security**

* Encryption at rest: AES-256 for database and file storage  
* Encryption in transit: TLS 1.3 for all API communications  
* Database credentials: Stored in AWS Secrets Manager / GCP Secret Manager  
* API keys: Rotated every 90 days, never committed to version control  
* Environment variables: Separate configs for dev/staging/production  
* SQL injection prevention: Parameterized queries via Prisma ORM  
* XSS prevention: Content Security Policy headers, input sanitization  
* CSRF protection: SameSite cookies, CSRF tokens for state-changing requests  
* Clickjacking protection: X-Frame-Options: DENY header

## **9.4 Compliance & Audit**

* GDPR compliance: User data export, right to deletion, consent tracking  
* Audit logging: All user actions logged with timestamp, IP, user agent  
* Data retention: Automated archival and purging per policy  
* Access logs: 90-day retention, exportable for compliance reviews  
* Security headers: Helmet.js for Express (HSTS, CSP, etc.)  
* Dependency scanning: Automated vulnerability checks via Snyk/Dependabot  
* Penetration testing: Annual third-party security audit recommended

## **9.5 API Security**

* CORS: Whitelist of allowed origins (restaurant domain only)  
* Rate limiting: Express Rate Limit middleware (see Section 8.7)  
* Request validation: Zod schemas for all input validation  
* File uploads: Virus scanning, size limits (5MB max), allowed types validation  
* Image uploads: Strip EXIF metadata, reprocess to prevent malicious embeds  
* Error messages: Generic messages in production (no stack traces)  
* Logging: Winston logger with log levels, sensitive data redaction

# **10\. UI/UX Design Guidelines**

## **10.1 Design Principles**

* Mobile-first approach: Design for smartphone screens, scale up for tablets/desktop  
* Touch-optimized: Minimum 44x44px touch targets, generous spacing  
* One-handed use: Critical actions accessible within thumb reach  
* High contrast: Readable in various lighting conditions (cellar, bar)  
* Minimal cognitive load: Single-purpose screens, progressive disclosure  
* Instant feedback: Loading states, success confirmations, error messages  
* Offline-capable: Queue actions when offline, sync when back online

## **10.2 Color Palette**

Wine-themed professional color scheme:

* Primary: \#8B1538 (Burgundy) \- Main brand color, CTAs  
* Secondary: \#C9A961 (Gold) \- Accents, highlights  
* Success: \#059669 (Emerald) \- Success states, confirmations  
* Warning: \#D97706 (Amber) \- Warnings, low stock alerts  
* Error: \#DC2626 (Red) \- Errors, validation failures  
* Neutral Gray: \#6B7280 \- Text, borders, backgrounds  
* Background: \#F9FAFB (Off-white) \- Page backgrounds  
* Surface: \#FFFFFF (White) \- Cards, modals, inputs

## **10.3 Typography**

* Font family: Inter (system fallback: \-apple-system, BlinkMacSystemFont, Segoe UI)  
* Headings: Bold, sizes from 24px (H1) to 16px (H4)  
* Body text: 16px regular (mobile), 14px regular (desktop)  
* Labels: 14px medium weight  
* Buttons: 16px medium weight, uppercase  
* Line height: 1.5 for body, 1.2 for headings  
* Accessibility: Minimum 4.5:1 contrast ratio for all text

## **10.4 Key Screen Designs**

### **Login Screen**

* Centered login form with restaurant logo  
* Email/username and password fields  
* Remember me checkbox  
* Forgot password link  
* Large login button (full-width on mobile)  
* Version number in footer  
* Background: Subtle wine-themed imagery

### **Dashboard / Home Screen**

* Welcome message with user name  
* Two large action buttons: Start New Count, View Reports  
* Quick stats: Total wines, last count date, variance alert  
* Recent activity feed (last 5 actions)  
* Bottom navigation: Dashboard, Inventory, Wines, Profile  
* Floating action button for quick count (bottom right)

### **Inventory Mode Selection**

* Header: Count Session \#123 \- In Progress  
* Three large cards for selection:  
*   1\. Manual Search \- keyboard icon, "Type wine name"  
*   2\. Barcode Scanner \- barcode icon, "Scan bottle barcode"  
*   3\. Image Recognition \- camera icon, "Photograph wine label"  
* Each card shows estimated time and accuracy  
* Progress indicator: X of 200 wines counted  
* Finish Count button at bottom (red, prominent)

### **Manual Search Screen**

* Large search input with autocomplete dropdown  
* Search icon inside input (left), clear button (right)  
* Filter chips: Wine Type, Region, Price Range  
* Search results as scrollable cards:  
*   \- Wine name (bold), producer, vintage  
*   \- Thumbnail image  
*   \- Last count quantity and date  
*   \- Quick add button (+)  
* Tap card to view details  
* Recently counted section at top

### **Camera Capture Screen**

* Full-screen camera viewfinder  
* Mode toggle: Barcode | Photo (top center)  
* Capture button (large circle, bottom center)  
* Flashlight toggle (top left)  
* Close/back button (top right)  
* For barcode: Overlay scanning frame with instructions  
* For photo: Grid overlay, tap to focus  
* Auto-capture countdown when barcode detected  
* Loading spinner during AI processing

### **Wine Detail Card**

* Appears as bottom sheet/modal after recognition  
* Wine image at top (100x200px)  
* Wine name (18px bold), producer, vintage  
* Confidence indicator if AI-recognized (e.g., 95% match)  
* Previous count: 12 bottles on Jan 15, 2026  
* Large quantity input: \+/- buttons, numeric keyboard  
* Notes field (expandable)  
* Photo attachment button  
* Confirm button (green, full-width)  
* Not this wine? Search again link

## **10.5 Accessibility**

* WCAG 2.1 AA compliance  
* Semantic HTML elements (header, nav, main, footer)  
* ARIA labels for icon buttons and dynamic content  
* Keyboard navigation support for all interactive elements  
* Focus indicators visible on all focusable elements  
* Screen reader testing with VoiceOver (iOS) and TalkBack (Android)  
* Alt text for all images  
* Color not sole indicator of state (use icons \+ text)  
* Adjustable text size (respect browser/OS settings)

# **11\. Mobile Responsiveness**

## **11.1 Responsive Breakpoints**

* Mobile: 320px \- 767px (primary target)  
* Tablet: 768px \- 1023px  
* Desktop: 1024px+ (secondary, for admin tasks)  
* Layout system: Tailwind CSS breakpoints (sm, md, lg, xl)  
* Approach: Mobile-first CSS (base styles for mobile, scale up with media queries)

## **11.2 Mobile Optimizations**

* Viewport meta tag: width=device-width, initial-scale=1, maximum-scale=1  
* Touch events: 300ms delay removed with touch-action CSS  
* Haptic feedback on actions (iOS/Android vibration API)  
* Native scrolling with momentum (overflow-scrolling: touch)  
* Pull-to-refresh on inventory lists  
* Lazy image loading with IntersectionObserver  
* Service worker for offline functionality  
* App shell architecture for instant loading  
* Minimal bundle size: Code splitting, tree shaking, dynamic imports

## **11.3 Progressive Web App (PWA)**

The app will be a full-featured PWA with:

* Web app manifest for Add to Home Screen  
* App icons: 192x192, 512x512 PNG  
* Splash screens for iOS and Android  
* Service worker with offline-first caching strategy  
* Background sync for queued inventory updates  
* Push notifications for low stock alerts (optional)  
* Lighthouse PWA score target: 100/100

## **11.4 Device Compatibility**

* iOS: Safari 14+, Chrome 90+  
* Android: Chrome 90+, Samsung Internet 14+  
* Camera API: MediaDevices getUserMedia() with fallback  
* Barcode scanning: Native WebAssembly for performance  
* Image processing: Client-side compression before upload  
* Tested devices: iPhone 12/13/14, Samsung Galaxy S21/S22, Google Pixel 6/7

## **11.5 Performance Targets**

* First Contentful Paint (FCP): \< 1.5s  
* Largest Contentful Paint (LCP): \< 2.5s  
* Time to Interactive (TTI): \< 3.5s  
* Cumulative Layout Shift (CLS): \< 0.1  
* First Input Delay (FID): \< 100ms  
* Bundle size: \< 200KB initial load (gzipped)  
* Image optimization: WebP format with JPEG fallback, lazy loading  
* API response time: \< 200ms average (excluding AI inference)

# **12\. Implementation Timeline**

Proposed 16-week development schedule from project kickoff to production deployment.

| Phase | Duration | Key Deliverables | Dependencies |
| :---- | :---- | :---- | :---- |
| **Phase 1: Discovery & Design** | Weeks 1-2 | Requirements finalization, UI/UX mockups, database schema, API design | Client approval on designs |
| **Phase 2: Infrastructure Setup** | Week 3 | Cloud environment, CI/CD pipelines, dev/staging/prod environments, repo setup | Cloud account access |
| **Phase 3: Backend Core Development** | Weeks 4-7 | Database setup, authentication, wine catalog APIs, basic inventory APIs | Schema approval |
| **Phase 4: Frontend Core Development** | Weeks 5-8 | React app scaffold, auth UI, dashboard, manual search, wine details | API endpoints available |
| **Phase 5: AI Integration** | Weeks 8-10 | Barcode scanning, image recognition API, Google Cloud Vision setup, ML model training | Wine image dataset, Cloud APIs enabled |
| **Phase 6: Camera Features** | Weeks 9-11 | Camera UI, barcode scanner, image capture, AI integration on frontend | AI APIs ready |
| **Phase 7: Inventory Flow** | Weeks 10-12 | Complete inventory counting workflow, multi-mode support, session management | Core features complete |
| **Phase 8: Reporting & Admin** | Weeks 11-13 | Admin panel, reports, analytics, user management, audit logs | Database populated with test data |
| **Phase 9: Testing & QA** | Weeks 13-14 | Unit tests, integration tests, E2E tests, mobile device testing, security audit | All features code complete |
| **Phase 10: UAT & Training** | Week 15 | User acceptance testing, staff training, documentation, final adjustments | Staging environment ready |
| **Phase 11: Deployment & Launch** | Week 16 | Production deployment, data migration, go-live support, monitoring setup | UAT approval |

## **Milestones**

* Week 2: Design approval  
* Week 7: Backend API demo  
* Week 11: Camera features working  
* Week 13: Feature complete  
* Week 14: QA sign-off  
* Week 16: Production launch

# **13\. Cost Estimation**

## **13.1 Development Costs**

One-time development investment:

| Resource | Hours / Rate | Cost (USD) |
| :---- | :---- | :---- |
| **Senior Full-Stack Developer** | 640 hrs @ $100/hr | $64,000 |
| **UI/UX Designer** | 120 hrs @ $80/hr | $9,600 |
| **ML/AI Engineer** | 160 hrs @ $120/hr | $19,200 |
| **QA Engineer** | 80 hrs @ $60/hr | $4,800 |
| **DevOps Engineer** | 40 hrs @ $90/hr | $3,600 |
| **Project Manager** | 160 hrs @ $80/hr | $12,800 |
| **TOTAL DEVELOPMENT** |  | $114,000 |

## **13.2 Infrastructure Costs**

Monthly recurring costs (estimated):

| Service | Specification | Monthly Cost |
| :---- | :---- | :---- |
| **AWS ECS / Cloud Run** | 2 containers, 1GB RAM each | $50 |
| **PostgreSQL (RDS/Cloud SQL)** | db.t3.small, 20GB SSD | $30 |
| **Redis (ElastiCache)** | cache.t3.micro | $15 |
| **S3 / Cloud Storage** | 50GB storage, 10GB transfer | $5 |
| **Google Cloud Vision API** | \~500 images/month | $3 |
| **Cloudflare CDN** | Free tier | $0 |
| **Domain & SSL** | domain \+ cert | $2 |
| **Monitoring (Sentry)** | Team plan | $29 |
| **Backup storage** | Automated backups | $10 |
| **TOTAL MONTHLY** |  | $144 |
| **TOTAL ANNUAL** |  | $1,728 |

## **13.3 Total Cost of Ownership (First Year)**

* Development: $114,000  
* Infrastructure (12 months): $1,728  
* Training & Documentation: $2,000  
* Security Audit: $3,000  
* Contingency (10%): $12,073  
* TOTAL FIRST YEAR: $132,801

## **13.4 Ongoing Annual Costs**

* Infrastructure: $1,728/year  
* Maintenance & Support (20% of dev): $22,800/year  
* Google Cloud Vision API (600 images/month): $36/year  
* SSL renewal, domain: $24/year  
* Total Annual Operating Cost: $24,588

# **14\. Maintenance & Support**

## **14.1 Support Tiers**

| Tier | Response Time | Scope |
| :---- | :---- | :---- |
| **Critical (P1)** | 1 hour | System down, data loss, security breach |
| **High (P2)** | 4 hours | Core features broken, major bugs |
| **Medium (P3)** | 1 business day | Minor bugs, usability issues |
| **Low (P4)** | 3 business days | Feature requests, enhancements |

## **14.2 Maintenance Activities**

* Monthly security patches and dependency updates  
* Quarterly performance optimization reviews  
* Bi-annual disaster recovery testing  
* Annual security audit and penetration testing  
* Database optimization and index tuning  
* Log rotation and archival  
* SSL certificate renewal (automated)  
* Backup verification and restoration tests

## **14.3 Monitoring & Alerting**

* Server health: CPU, memory, disk usage  
* Application metrics: Request rates, error rates, latency  
* Database performance: Query times, connection pool  
* AI service health: Recognition success rate, API latency  
* User activity: Active sessions, inventory counts per day  
* Alerts: Slack/email notifications for critical events  
* Uptime monitoring: 99.9% target, Pingdom/UptimeRobot  
* Log aggregation: CloudWatch/Stackdriver for centralized logging

## **14.4 Update & Upgrade Process**

* Release cycle: Minor updates monthly, major releases quarterly  
* Testing: All updates tested in staging before production  
* Deployment window: Off-peak hours (2-4 AM local time)  
* Rollback plan: Automated rollback if health checks fail  
* Changelog: Documented in release notes, sent to stakeholders  
* User notification: In-app banner for planned maintenance

# **15\. Appendices**

## **Appendix A: Glossary**

* API: Application Programming Interface  
* CDN: Content Delivery Network  
* CNN: Convolutional Neural Network  
* CORS: Cross-Origin Resource Sharing  
* CSRF: Cross-Site Request Forgery  
* JWT: JSON Web Token  
* ML: Machine Learning  
* OCR: Optical Character Recognition  
* ORM: Object-Relational Mapping  
* PWA: Progressive Web App  
* RBAC: Role-Based Access Control  
* REST: Representational State Transfer  
* SKU: Stock Keeping Unit  
* UPC: Universal Product Code  
* EAN: European Article Number

## **Appendix B: Wine Image Dataset Requirements**

For training the custom image recognition model, the following dataset is required:

* Images per wine: Minimum 50 (recommended 100+)  
* Image types: Front label, angled view, full bottle  
* Image quality: Minimum 640x480px, JPEG format  
* Lighting conditions: Varied (bright, dim, natural, artificial)  
* Backgrounds: Both plain and realistic (shelf, table)  
* Augmentation: Rotation, zoom, brightness adjustments  
* Total dataset size: \~10,000 images for 200 wines  
* Labeling: Each image tagged with wine\_id and metadata  
* Split: 80% training, 10% validation, 10% test

## **Appendix C: Sample Queries**

Common database queries optimized for performance:

\-- Get current inventory with variance  
SELECT   
  w.name, w.producer, w.vintage,  
  COALESCE(latest.quantity, 0\) as current\_stock,  
  w.par\_level,  
  COALESCE(latest.quantity, 0\) \- w.par\_level as variance  
FROM wines w  
LEFT JOIN LATERAL (  
  SELECT quantity   
  FROM inventory\_items ii  
  JOIN inventory\_counts ic ON ii.count\_id \= ic.id  
  WHERE ii.wine\_id \= w.id AND ic.status \= 'completed'  
  ORDER BY ic.completed\_at DESC  
  LIMIT 1  
) latest ON true  
WHERE w.is\_active \= true  
ORDER BY variance ASC;  
    

## **Appendix D: Deployment Checklist**

□ All environment variables configured in production

□ SSL certificate installed and validated

□ Database backups automated and tested

□ Monitoring and alerting configured

□ Error tracking (Sentry) enabled

□ Rate limiting configured

□ Security headers verified (HSTS, CSP, etc.)

□ Google Cloud Vision API quota increased

□ CDN configured and tested

□ User accounts created for all staff

□ Wine catalog imported and validated

□ Mobile devices tested on production

□ Load testing completed

□ Disaster recovery plan documented

□ Staff training completed

□ Go-live communication sent to stakeholders

## **Appendix E: References & Resources**

* Vivino API Documentation: https://vivino.com/api  
* Google Cloud Vision: https://cloud.google.com/vision/docs  
* QuaggaJS Documentation: https://serratus.github.io/quaggaJS/  
* TensorFlow.js: https://www.tensorflow.org/js  
* React Documentation: https://react.dev  
* PostgreSQL Best Practices: https://wiki.postgresql.org/wiki/Don%27t\_Do\_This  
* OWASP Top 10: https://owasp.org/www-project-top-ten/  
* PWA Checklist: https://web.dev/pwa-checklist/

# **Document Control**

| Document Version | 1.0 |
| :---- | :---- |
| **Last Updated** | February 9, 2026 |
| **Author** | Technical Solutions Team |
| **Status** | Final |
| **Next Review Date** | March 2026 |

