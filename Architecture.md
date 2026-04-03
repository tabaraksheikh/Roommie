## Roommie – Student Housing Finder Platform



## 1. Scope

The Roommate Rental System is a web-based application designed to help users find suitable roommates and rental options in an organized way. Users can create accounts, post and manage listings, browse available rooms, and connect with others looking for shared housing.

The project focuses on core features such as user registration, listing management, and search functionality. Communication between users is handled through external platforms like WhatsApp rather than an internal chat system.

Advanced features such as online payments, identity verification, and integration with external services are out of the scope of this project, as the goal is to keep the system simple and focused.

## 2. References
https://www.cs.ubc.ca/~gregor/teaching/papers/4+1view-architecture.pdf

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
The logical architecture describes the main functional components of Roommie and how responsibilities are distributed between them. It focuses on major abstractions rather than implementation details.

Roommie follows a layered architecture with MVC-style separation in the backend.

The main logical components are:

### User Management

Handles:
- account registration
- login
- password change
- password reset
- email change
- account deletion
- profile update and retrieval

This component manages user identity and account state.

### OTP Verification System

Handles:
- OTP generation
- OTP storage
- OTP verification
- OTP expiration
- one-time usage of verification codes

OTP is used for:
- account registration
- password reset
- email change confirmation

Unverified users are not stored in the `users` table until OTP verification succeeds.

### Listing Management

Handles:
- creating listings
- editing listings
- deleting listings
- retrieving listing details
- associating listings with a user
- validating contact and room information

Listing data includes room type, description, location, price, preferences, images, and contact information.

### Search and Filtering

Handles:
- browsing listings
- searching by title or location
- filtering by city, district, room type, amenities, maximum price, roommate count, gender preference, smoking preference, pets, and environment

This component supports efficient discovery of suitable rooms.

### Saved Rooms Management

Handles:
- saving listings
- unsaving listings
- retrieving saved listings
- preventing duplicate saved entries

### Reference Data Management

Handles system-wide lookup data such as:
- cities
- districts
- amenities

This ensures consistency across listing creation, filtering, and display.

### Image Management

Handles:
- receiving uploaded images
- storing them on the server filesystem
- linking image paths to listings
- deleting removed or replaced files

### Persistence Layer

Stores all structured system data in MySQL using normalized tables:
- users
- listings
- listing_images
- saved_rooms
- otp_requests
- cities
- districts
- amenities
- listing_amenities

The logical architecture supports separation of concerns and reduces duplication between components.

The layered class diagram is placed in this section because it shows the main logical components of the system and the relationships between controllers, services, models, entities, and supporting utilities.

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
