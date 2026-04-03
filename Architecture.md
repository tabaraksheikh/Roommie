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
The following layered class diagram presents the main structural elements of Roommie and the relationships between controllers, services, models, entities, and utility components. It shows how responsibilities are separated across the backend architecture and how the major system components interact.

```mermaid
classDiagram
  direction TB

  namespace Entities {
    class User["User <<entity>>"] {
      -id : int
      -email : string
      -password : string
      -first_name : string
      -last_name : string
      -gender : string
      -bio : string
    }
    class Listing["Listing <<entity>>"] {
      -id : int
      -user_id : int
      -city_id : int
      -district_id : int
      -title : string
      -type : string
      -price : decimal
      -phone : string
      -imageUrls : string[]
      -created_at : datetime
    }
    class SavedRoom["SavedRoom <<entity>>"] {
      -id : int
      -user_id : int
      -listing_id : int
      -created_at : datetime
    }
    class OTPRequest["OTPRequest <<entity>>"] {
      -id : int
      -email : string
      -purpose : string
      -otp_code : string
      -expires_at : datetime
      -used_at : datetime
    }
    class City["City <<entity>>"] {
      -id : int
      -name : string
      -slug : string
      -plate_code : string
    }
    class District["District <<entity>>"] {
      -id : int
      -city_id : int
      -name : string
      -slug : string
    }
    class Amenity["Amenity <<entity>>"] {
      -id : int
      -name : string
      -slug : string
    }
  }

  namespace Models {
    class UserModel["UserModel <<model>>"] {
      +findById(id)
      +findByIdWithPassword(id)
      +findByEmail(email)
      +createUser(data)
      +updateUser(id, data)
      +updateEmail(id, email)
      +updatePassword(id, hash)
      +deleteUser(id)
    }
    class ListingModel["ListingModel <<model>>"] {
      +findById(id)
      +findRawById(id)
      +findAll(filters, limit, offset)
      +findFeatured()
      +createListing(data)
      +updateListing(id, data)
      +deleteListing(id)
      +resolveLocationRefs(location)
      +syncListingAmenities(id, amenities)
    }
    class SavedModel["SavedModel <<model>>"] {
      +findAllByUser(userId)
      +isSaved(userId, listingId)
      +saveListing(userId, listingId)
      +unsaveListing(userId, listingId)
    }
    class OtpModel["OtpModel <<model>>"] {
      +replacePendingOtp(data)
      +findLatestPendingOtp(email, purpose)
      +markOtpUsed(id)
    }
  }

  namespace Services {
    class AuthService["AuthService <<service>>"] {
      +register(data)
      +login(data)
      +changePassword(userId, data)
      +resetPassword(userId, newPassword)
      +changeEmail(userId, newEmail)
      +deleteAccount(userId)
    }
    class UsersService["UsersService <<service>>"] {
      +getMe(userId)
      +updateMe(userId, data)
      +getUserById(userId)
    }
    class ListingsService["ListingsService <<service>>"] {
      +getListings(query)
      +getFeatured()
      +getListingById(id)
      +createListing(userId, body, imageUrls)
      +updateListing(listingId, userId, body, imageFiles)
      +deleteListing(listingId, userId)
    }
    class SavedService["SavedService <<service>>"] {
      +getSavedListings(userId)
      +checkSaved(userId, listingId)
      +saveListing(userId, listingId)
      +unsaveListing(userId, listingId)
    }
    class OtpStore["OtpStore <<service>>"] {
      +saveOtp(email, purpose, payload)
      +verifyOtp(email, purpose, code)
    }
    class EmailService["EmailService <<service>>"] {
      +sendOtpEmail(toEmail, otp, type)
    }
  }

  namespace Controllers {
    class AuthController["AuthController <<controller>>"] {
      +sendVerification(req, res)
      +verifyEmail(req, res)
      +login(req, res)
      +getMe(req, res)
      +changePassword(req, res)
      +requestEmailChange(req, res)
      +confirmEmailChange(req, res)
      +requestPasswordReset(req, res)
      +resetPassword(req, res)
      +deleteAccount(req, res)
    }
    class ListingsController["ListingsController <<controller>>"] {
      +getListings(req, res)
      +getFeatured(req, res)
      +getListingById(req, res)
      +createListing(req, res)
      +updateListing(req, res)
      +deleteListing(req, res)
    }
    class UsersController["UsersController <<controller>>"] {
      +getMe(req, res)
      +updateMe(req, res)
      +getUserById(req, res)
    }
    class SavedController["SavedController <<controller>>"] {
      +getSavedListings(req, res)
      +checkSaved(req, res)
      +saveListing(req, res)
      +unsaveListing(req, res)
    }
  }

  namespace Utilities {
    class PriceUtil["PriceUtil <<utility>>"] {
      +parseDecimalPrice(value)
    }
    class UploadCleanup["UploadCleanup <<utility>>"] {
      +deleteUploadFiles(imageUrls)
      +resolveUploadPath(imageUrl)
    }
  }

  User "1" --> "0..*" Listing : owns
  User "1" --> "0..*" SavedRoom : saves
  SavedRoom "0..*" --> "1" Listing : references
  City "1" --> "0..*" District : contains
  Listing "0..*" --> "0..1" City : located in
  Listing "0..*" --> "0..1" District : located in
  Listing "0..*" --> "0..*" Amenity : has

  UserModel ..> User : reads/writes
  ListingModel ..> Listing : reads/writes
  SavedModel ..> SavedRoom : reads/writes
  OtpModel ..> OTPRequest : reads/writes

  AuthService --> UserModel : uses
  AuthService --> OtpStore : uses
  AuthService --> EmailService : triggers
  UsersService --> UserModel : uses
  ListingsService --> ListingModel : uses
  ListingsService --> UploadCleanup : uses
  SavedService --> SavedModel : uses
  SavedService --> ListingModel : validates existence
  OtpStore --> OtpModel : uses

  AuthController --> AuthService : delegates to
  ListingsController --> ListingsService : delegates to
  UsersController --> UsersService : delegates to
  SavedController --> SavedService : delegates to

  ListingsService --> PriceUtil : validates price
  ListingModel --> PriceUtil : normalizes price

```

The diagram reflects Roommie’s layered design. Controllers handle HTTP requests, services contain business logic, models manage database access, entities represent the main stored data objects, and utilities provide shared support functions such as price parsing and upload cleanup.

## 6. Process Architecture


### Activity Diagrams

An activity diagram shows the step-by-step flow of actions in a system process. It helps illustrate how a task starts, what decisions are made during execution, and how the process ends. Here are two examples of activity diagrams in Roommie: Post Listing and User Registration with OTP.

#### Post Listing Activity Diagram

```mermaid
flowchart LR
    Start([Open Post Listing page]) --> Logged{Logged in?}

    Logged -- NO --> ShowLogin[Show login/signup]
    ShowLogin --> Continue[Continue]
    Continue --> Login[Log in or sign up]
    Login --> Return[Return]

    Logged -- YES --> FillForm[Fill listing form]
    FillForm --> Submit[Submit]
    Submit --> FormValid{Form valid?}

    FormValid -- NO --> ShowValidationErrors[Show validation errors]
    ShowValidationErrors --> BackToForm1[Back to form]
    BackToForm1 --> FillForm

    FormValid -- YES --> SendToServer[Send data to server]
    SendToServer --> Save[Save]

    Save --> SaveSuccess{Save successful?}
    SaveSuccess -- NO --> ShowSaveError[Show save error]
    ShowSaveError --> BackToForm2[Back to form]
    BackToForm2 --> FillForm

    SaveSuccess -- YES --> StoreInDB[Store in database]
    StoreInDB --> Respond[Respond]
    Respond --> ReturnSuccess[Return success response]
    ReturnSuccess --> Show[Show]
    Show --> ShowSuccessMsg[Show success message]
    ShowSuccessMsg --> Redirect[Redirect]
    Redirect --> RedirectToListings[Redirect to My Listings]
    RedirectToListings --> End([End])
```

This activity diagram shows the process of creating a new listing. It includes checking whether the user is logged in, filling and validating the form, sending the data to the backend, saving the listing, and showing a success response.

#### User Registration with OTP Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User enters signup information]
    B --> C[Frontend sends registration request]
    C --> D[Backend validates signup data]

    D --> E{Is signup data valid?}
    E -- No --> F[Return validation error]
    F --> Z([End])

    E -- Yes --> G[Backend generates OTP]
    G --> H[Store OTP in otp_requests]
    H --> I[Send OTP email to user]
    I --> J[User enters received OTP]
    J --> K[Frontend sends OTP verification request]
    K --> L[Backend checks OTP validity and expiration]

    L --> M{Is OTP valid?}
    M -- No --> N[Return invalid or expired OTP error]
    N --> J

    M -- Yes --> O[Create user in users]
    O --> P[Generate JWT token]
    P --> Q[Return token and user data]
    Q --> R[Frontend logs user in]
    R --> Z([End])
```

This activity diagram shows the process of registering a new user account with email verification. It includes signup validation, OTP generation, email sending, OTP verification, and final account creation.

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

Roommie is designed for a small-to-medium academic project scale. The system is expected to support a moderate number of users and listings while remaining simple, maintainable, and efficient.

### Expected Size
- moderate number of registered users
- moderate number of active listings
- small reference datasets for cities, districts, and amenities
- limited number of images per listing

### Performance Characteristics
- listing search and filtering are handled through structured backend queries
- pagination reduces the amount of data loaded at one time
- normalized reference tables reduce redundancy and improve consistency
- images are stored in the filesystem instead of the database to keep database queries lighter
- OTP operations are lightweight and short-lived

### Limitations
- no caching layer
- no load balancing
- no distributed file storage
- no asynchronous job queue
- single-server assumptions

These tradeoffs are acceptable for the current project scope.
## 11. Quality

## 12. Appendices

### Acronyms and Abbreviations
- OTP: One-Time Password
- JWT: JSON Web Token
- MVC: Model-View-Controller
- API: Application Programming Interface
- SMTP: Simple Mail Transfer Protocol
- DB: Database

### Definitions
- Listing: A room advertisement posted by a user
- Poster: The user who created a listing
- Saved Room: A listing bookmarked by a user
- Reference Data: Shared lookup data such as cities, districts, and amenities
- OTP Request: A temporary verification record used during signup, password reset, or email change
- Authentication: The process of verifying the identity of a user
- Authorization: The process of checking whether a user has permission to perform an action

### Design Principles
- Separation of Concerns
- Layered Architecture
- Single Responsibility Principle
- Low Coupling
- High Cohesion
- Normalized Data Design
- Simplicity over unnecessary complexity



