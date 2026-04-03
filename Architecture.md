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

## Layered Class Diagram


## 6. Process Architecture
## 7. Development Architecture
## 8. Physical Architecture
## 9. Scenarios

### Scenario 1: User Registration with OTP
User enters signup information.
Frontend sends registration request.
Backend generates OTP and stores it in otp_requests.
Backend sends OTP email.
User submits the OTP.
Backend verifies the OTP.
User account is created in users.
JWT token is returned.

This validates:
authentication
OTP subsystem
email service
persistence

### Scenario 2: Profile Update
Authenticated user opens the profile page.
Frontend requests the current user profile.
Backend validates the JWT token.
Backend retrieves the user from the database.
Frontend fills the profile form with stored data.
User edits profile fields such as name, gender, or bio.
Frontend sends the updated profile data to the backend.
Backend validates and saves the updated fields.
Updated profile data is returned and shown in the UI.

This validates:
user management
protected routes
profile retrieval and update
persistence consistency

### Scenario 3: Room Request
User browses available listings.
User opens a listing they are interested in.
Frontend displays room details, preferences, and poster contact information.
User decides to reserve or request the room.
Instead of an internal booking system, the platform directs the user to contact the poster through WhatsApp or the provided contact method.
User sends a message expressing interest in the room.
Poster reviews the request externally and decides whether the room is still available.
If both sides agree, the reservation is handled outside the platform.
The listing may later be removed or updated by the poster if the room is no longer available.

This validates:
listing retrieval
poster profile and contact flow
simple user decision flow
system scope constraint with no internal reservation module

### Scenario 4: Browse and Filter Listings
User opens browse page.
User selects filters and enters search text.
Frontend sends filter parameters to backend.
Backend returns matching listings with pagination.
Frontend renders cards and navigation controls.
This validates:

search and filtering
listing retrieval
frontend-backend interaction


### Scenario 5 : Posting a Listing
Authenticated user opens the post listing page.
Frontend loads reference data such as cities, districts, and amenities.
User enters room details, price, preferences, description, and contact information.
User selects one or more images for the listing.
Frontend validates required fields before submission.
Frontend sends the listing data and images to the backend.
Backend verifies the JWT token and confirms the user is authenticated.
Backend validates and normalizes the listing data.
Upload middleware stores image files in the uploads folder.
Backend inserts the listing into listings.
Backend inserts related image records into listing_images.
Backend inserts selected amenities into listing_amenities.
Backend returns the created listing response.
Frontend shows success feedback and the listing becomes visible in browse results.
This validates:

authentication
listing management
image management
reference data usage
persistence consistency between these 5 scenario none of them are same right


## 10. Size and Performance
## 11. Quality

## Appendices

### Acronyms and Abbreviations
### Definitions
### Design Principles
