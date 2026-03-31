## Roommie – Student Housing Finder Platform



## 1. Scope

The Roommate Rental System is a web-based application designed to help users find suitable roommates and rental options in an organized way. Users can create accounts, post and manage listings, browse available rooms, and connect with others looking for shared housing.

The project focuses on core features such as user registration, listing management, and search functionality. Communication between users is handled through external platforms like WhatsApp rather than an internal chat system.

Advanced features such as online payments, identity verification, and integration with external services are out of the scope of this project, as the goal is to keep the system simple and focused.

## 2. References

## 3. Software Architecture
The system is designed using a layered structure that separates the user interface, application logic, and data storage. This makes the application easier to organize, develop, and maintain.

It includes:

Frontend: The part users interact with (login, listings, search)
Backend: Handles system logic and manages users and listings
Database: Stores user and listing data

This approach keeps the system simple while still allowing future improvements.
## 4. Architectural Goals & Constraints
Goals
Provide a clear and easy-to-use interface
Help users quickly find suitable listings
Allow simple management of listings
Keep the system organized and maintainable
Ensure good performance
Constraints
Web-based application only
Limited time and resources (course project)
No internal messaging system (external apps are used)
No integration with payment systems or external APIs
Focus on core features only (listings, search, profiles)
## 5. Logical Architecture
The logical architecture describes the main functional components of Roommie system and how responsibilities are distributed between them. It focuses on the system’s key abstractions and their relationships, independent of implementation details.

The Roommie system follows a layered architecture based on the Model–View–Controller (MVC) pattern, where the system is organized into logical components that separate user interaction, application logic, and data management.

The system is composed of the following main logical components:

User Management
Handles user-related operations such as registration, login, profile management, and account deletion. It is responsible for maintaining user information and enforcing authentication rules.

Listing Management
Manages all operations related to room listings. This includes creating, updating, deleting, and retrieving listings. It also handles listing details such as title, location, price, images, and contact information.

Search and Filtering
Responsible for retrieving listings based on user-defined criteria such as city, district, price range, room type, amenities, and roommate preferences. It ensures that users can efficiently find suitable listings.

Amenities and Preferences Management
Handles predefined lists of amenities and roommate preferences. These components ensure consistency in how listings are described and filtered across the system.

Saved Rooms Management
Allows users to save and manage favorite listings. It ensures that users can store and access preferred listings without duplication.

OTP Verification System
Manages the generation and verification of one-time passwords (OTP) used for email verification, password reset, and account updates. It ensures security by enforcing expiration and validation rules.

Image Management
Handles the storage and retrieval of listing images. Each listing can contain multiple images, with a defined maximum limit.

These components interact to support the main system functionalities. For example, when a user creates a listing, the listing management component coordinates with image management, preferences management, and user management to store all required information.

The logical architecture ensures a clear separation of responsibilities, making the system easier to understand, maintain, and extend. It also supports scalability by allowing each component to evolve independently without affecting the overall system structure.
## 6. Process Architecture
## 7. Development Architecture
## 8. Physical Architecture
## 9. Scenarios
## 10. Size and Performance
## 11. Quality

## Appendices

### Acronyms and Abbreviations
### Definitions
### Design Principles
