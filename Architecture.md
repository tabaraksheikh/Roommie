## Roommie – Student Housing Finder Platform



## 1. Scope

The Roommate Rental System is a web-based application designed to help users find suitable roommates and rental options in an organized way. Users can create accounts, post and manage listings, browse available rooms, and connect with others looking for shared housing.

The project focuses on core features such as user registration, listing management, and search functionality. Communication between users is handled through external platforms like WhatsApp rather than an internal chat system.

Advanced features such as online payments, identity verification, and integration with external services are out of scope for this project, as the goal is to keep the system simple and focused.

## 2. References
- https://www.cs.ubc.ca/~gregor/teaching/papers/4+1view-architecture.pdf
- https://www.geeksforgeeks.org/system-design/package-diagram-introduction-elements-use-cases-and-benefits/
- https://en.wikipedia.org/wiki/4%2B1_architectural_view_model

## 3. Software Architecture
The system is designed using a layered structure that separates the user interface, application logic, and data storage. This makes the application easier to organize, develop, and maintain.

It includes:
- Frontend: The part users interact with (login, listings, search)
- Backend: Handles system logic and manages users and listings
- Database: Stores user and listing data

This approach keeps the system simple while still allowing future improvements.

## 4. Architectural Goals & Constraints

### Goals
- Provide a clear and easy-to-use interface
- Help users quickly find suitable listings
- Allow simple management of listings
- Keep the system organized and maintainable
- Ensure good performance

### Constraints
- Web-based application only
- Limited time and resources (course project)
- No internal messaging system (external apps are used)
- No integration with payment systems or external APIs
- Focus on core features only (listings, search, profiles)

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
  UsersService --> UserModel : uses
  ListingsService --> ListingModel : uses
  ListingsService --> UploadCleanup : uses
  SavedService --> SavedModel : uses
  SavedService --> ListingModel : validates existence
  OtpStore --> OtpModel : uses

  AuthController --> AuthService : delegates to
  AuthController --> OtpStore : uses
  AuthController --> EmailService : triggers
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

## Login Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Client
    participant Route as Auth Route
    participant Controller as Auth Controller
    participant Service as Auth Service
    participant DB as User Model / Database
    participant Storage as localStorage

    User->>UI: Enter email and password
    UI->>UI: handleLogin()
    UI->>API: RoommieAPI.login(email, password)
    API->>Route: POST /api/auth/login
    Route->>Controller: login(req, res)
    Controller->>Service: login({ email, password })
    Service->>DB: findByEmail(email)

    alt User not found
        DB-->>Service: null
        Service-->>Controller: 401 Invalid email or password
        Controller-->>Route: Error response
        Route-->>API: 401 JSON error
        API-->>UI: throw Error(...)
        UI-->>User: Show error toast
    else User found
        DB-->>Service: user + hashed password
        Service->>Service: Compare password with bcrypt

        alt Password is incorrect
            Service-->>Controller: 401 Invalid email or password
            Controller-->>Route: Error response
            Route-->>API: 401 JSON error
            API-->>UI: throw Error(...)
            UI-->>User: Show error toast
        else Password is correct
            Service->>Service: Generate JWT token
            Service-->>Controller: { token, user }
            Controller-->>Route: 200 Login successful
            Route-->>API: { token, user }
            API->>Storage: setToken(token)
            API->>Storage: setUser(user)
            API-->>UI: Success response
            UI->>UI: close login modal
            UI->>UI: completeAuthFlow(user, "login")
            UI-->>User: Redirect to target page / browse page
        end
    end

```

This sequence diagram shows the login flow of the Roommie website. The process starts when the user enters their email and password in the login modal and clicks the Log In button. The frontend handles this action through the login form and calls RoommieAPI.login(email, password) from the API client. Then, the API client sends a POST /api/auth/login request to the backend authentication route.

On the backend, the authentication route forwards the request to the authentication controller, which passes the email and password to the authentication service. The service searches for the user in the user model/database by using the submitted email address. If no user is found, the system returns an error response such as “Invalid email or password”, and the frontend displays this message as a toast notification.

If the user exists, the authentication service compares the entered password with the stored hashed password using bcrypt. If the password is incorrect, the backend again returns a 401 error, and the frontend shows an error toast. If the password is correct, the backend generates a JWT token and returns the token together with the user information.

After a successful login, the API client stores the token and user data in localStorage as roommie_token and roommie_user. The frontend then closes the login modal, updates the authenticated user interface, and redirects the user to the appropriate Roommie page, such as the browse page or the previously requested protected page.

## Post Listing Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Client
    participant Auth as Auth Middleware
    participant Upload as Upload Middleware
    participant Controller as Listings Controller
    participant Service as Listings Service
    participant DB as Listing Model / Database

    User->>UI: Fill listing form and click "Publish Listing"
    UI->>UI: publishListing()

    alt User is not logged in
        UI-->>User: Show login modal
    else User is logged in
        UI->>UI: Validate required fields
        UI->>UI: Normalize WhatsApp and map link
        UI->>UI: Build FormData with listing data and images
        UI->>API: RoommieAPI.createListing(formData)
        API->>Auth: POST /api/listings with Bearer token

        alt Token is missing or invalid
            Auth-->>API: 401 Unauthorized
            API-->>UI: throw Error(...)
            UI-->>User: Show error toast
        else Token is valid
            Auth->>Upload: Continue request
            Upload->>Upload: upload.array("images", 6)

            alt Invalid file type or file too large
                Upload-->>API: Upload error
                API-->>UI: throw Error(...)
                UI-->>User: Show error toast
            else Files accepted
                Upload->>Controller: createListing(req, res)
                Controller->>Controller: Extract listing data and image URLs
                Controller->>Service: createListing(userId, body, imageUrls)

                alt Listing validation fails
                    Service-->>Controller: 400 Validation error
                    Controller-->>API: Error response
                    API-->>UI: throw Error(...)
                    UI-->>User: Show error toast
                else Listing data is valid
                    Service->>DB: createListing(...)
                    DB-->>Service: Created listing row
                    Service-->>Controller: Formatted listing
                    Controller-->>API: 201 Listing created
                    API-->>UI: Success response
                    UI-->>User: Show "Listing published"
                    UI->>UI: Redirect to /pages/space.html
                end
            end
        end
    end

```

This sequence diagram shows how a logged-in Roommie user publishes a new room listing. The process starts when the user fills in the listing form with details such as title, room type, city, district, description, price, phone number, WhatsApp information, map location, amenities, roommate preferences, and room images. When the user clicks Publish Listing, the frontend runs publishListing().

First, the frontend checks whether the user is logged in by using the stored authentication data. If the user is not logged in, Roommie displays the login modal and stops the publishing process. If the user is logged in, the frontend validates the required fields, normalizes the WhatsApp and map location values, and builds a FormData object that contains both the listing details and uploaded image files.

The API client then calls RoommieAPI.createListing(formData) and sends a POST /api/listings request with a Bearer token in the Authorization header. On the backend, the authentication middleware checks whether the token is missing, invalid, or expired. If the token is not valid, the server returns an unauthorized error, and the frontend shows an error toast.

If the token is valid, the upload middleware processes the uploaded room images. If an uploaded file is invalid or too large, the server returns an upload error, and the frontend displays the error. If the files are accepted, the request continues to the listings controller. The controller extracts the listing data and image URLs, then sends them to the listings service.

The listings service validates the listing data. If the listing information is missing or invalid, it returns a validation error. If the listing data is valid, the service creates a new listing record in the database through the listing model. After the database confirms that the listing has been created, the backend returns a success response. Finally, the frontend shows a “Listing published” message and redirects the user to the My Space page.

## Use-Case Diagram

```mermaid
flowchart LR
  subgraph Actors
    GuestA[Guest]
    StudentA[Student]
    HomeownerA[Homeowner]
    WhatsAppSystem["WhatsApp System"]
  end

  subgraph MainUseCases
    Register["Register Account"]
    Login["Login"]
    RequestPasswordReset["Request Password Reset"]
    RequestEmailChange["Request Email Change"]
    ResetPassword["Reset Password"]
    SaveListing["Save Listing"]
    UnsaveListing["Unsave Listing"]
    ViewSaved["View Saved Listings"]
    DeleteAccount["Delete Account"]
    ViewProfile["View Profile"]
    ConfirmEmailChange["Confirm Email Change"]
    UpdateProfile["Update Profile"]
    ContactViaWhatsApp["Contact Via WhatsApp"]
    ChangePassword["Change Password"]
    DeleteListing["Delete Listing"]
    CreateListing["Create Listings"]
    UpdateListing["Update Listings"]
    SearchFilter["Search & Filter Listing"]
    ViewFeatured["View Featured Listing"]
    BrowseListing["Browse Listing"]
    ViewDetails["View Listing Details"]
    SendOTP["Send OTP"]
    VerifyOTP["Verify OTP"]
  end

  GuestA --> Register
  GuestA --> Login
  GuestA --> RequestPasswordReset
  GuestA --> RequestEmailChange
  GuestA --> SearchFilter
  GuestA --> ViewFeatured
  GuestA --> BrowseListing

  StudentA --> ViewDetails
  StudentA --> SaveListing
  StudentA --> UnsaveListing
  StudentA --> ViewSaved
  StudentA --> ViewProfile
  StudentA --> ConfirmEmailChange
  StudentA --> UpdateProfile
  StudentA --> ContactViaWhatsApp
  StudentA --> ChangePassword
  StudentA --> DeleteAccount

  HomeownerA --> CreateListing
  HomeownerA --> UpdateListing
  HomeownerA --> DeleteListing
  HomeownerA --> ViewDetails
  HomeownerA --> ContactViaWhatsApp

  WhatsAppSystem --> ContactViaWhatsApp

  RequestPasswordReset -.-> SendOTP
  RequestEmailChange -.-> SendOTP
  ResetPassword -.-> VerifyOTP
  ConfirmEmailChange -.-> VerifyOTP
  RequestPasswordReset --> ResetPassword
  RequestEmailChange --> ConfirmEmailChange
  SearchFilter --> ViewDetails
  BrowseListing --> ViewDetails
  ViewFeatured --> ViewDetails
```

![Use-Case Diagram](images/UseCase_Diagram.png)

This use case diagram represents the Roommie platform and shows how users interact with the system. There are four main actors: **Guest**, **Student** (logged-in user), **Homeowner** (listing owner), and an external **WhatsApp System**. Each actor has different permissions based on their role.

### Guest
Guests can explore the platform without logging in:
- Browse listings, search, and apply filters  
- View featured listings  
- Register an account or log in to access more features  

### Student
Once logged in, users act as students and gain additional capabilities:
- View detailed listing information  
- Save/unsave listings and view saved listings  
- Contact homeowners via WhatsApp  
- Manage their account (update profile, change password, delete account)  

### Homeowner
Homeowners are responsible for managing listings:
- Create new listings  
- Update existing listings  
- Delete listings  
- View listing details and communicate via WhatsApp  

### System Features
- Authentication and security processes (password reset, email change)  
- OTP-based verification (**Send OTP** and **Verify OTP**) for sensitive actions  
- Core features like browsing, searching, and viewing listings  
- WhatsApp integration for direct communication between users  

 The system follows a marketplace model where guests explore, students search and interact, and homeowners manage listings, supported by secure authentication and communication tools.



## 7. Development Architecture

The development architecture of the Roommie system follows a layered structure consisting of Presentation, Application, Business, and Data layers. Each layer is responsible for a specific concern and interacts only with adjacent layers to maintain low coupling and high cohesion. The diagram below illustrates the organization of modules and their dependencies within the system.

### Package Diagram

```mermaid
flowchart TB
  subgraph Presentation_Layer["Presentation Layer"]
    FP["frontend/pages"]
    FS["frontend/scripts"]
    FAPI["scripts/api"]
    FAUTH["scripts/auth"]
    FLAYOUT["scripts/layout"]
    FLIST["scripts/listing"]
    FPAGE["scripts/pages"]
    FUSER["scripts/user"]
    FSTY["frontend/styles"]
    FSHARED["styles/shared"]
    FHOME["styles/home"]
    FLSTY["styles/listing"]
    FUSTY["styles/user"]
    FIMG["frontend/images"]

    FP --> FS
    FS --> FAPI
    FS --> FAUTH
    FS --> FLAYOUT
    FS --> FLIST
    FS --> FPAGE
    FS --> FUSER
    FSTY --> FSHARED
    FSTY --> FHOME
    FSTY --> FLSTY
    FSTY --> FUSTY
  end

  subgraph Application_Layer["Application Layer"]
    BR["backend/routes"]
    BC["backend/controllers"]
    BM["backend/middlewares"]
  end

  subgraph Business_Layer["Business Layer"]
    BS["backend/services"]
    BDL["backend/domains/listing"]
    BU["backend/utils"]
    BUP["backend/uploads"]
  end

  subgraph Data_Layer["Data Layer"]
    BMO["backend/models"]
    BCFG["backend/config"]
    BDB["backend/database"]
    BSCHEMA["database/schema"]
    BREF["database/reference-data"]
    BSETUP["database/setup"]
  end

  subgraph Support["Project Support"]
    RS["scripts"]
    RT["tests"]
  end

  FP --> BR
  FS --> BR

  BR --> BM
  BR --> BC
  BC --> BS

  BS --> BDL
  BS --> BU
  BS --> BMO
  BS --> BUP

  BMO --> BU
  BMO --> BCFG
  BMO --> BDB

  BDB --> BSCHEMA
  BDB --> BREF
  BDB --> BSETUP

  RS --> BSETUP
  RS --> BCFG
  RT --> BS
  RT --> BU
```
The Presentation Layer contains the frontend components responsible for user interaction, including pages, scripts, styles, and images. The scripts module handles client-side logic and communicates with the backend through API calls.

The Application Layer includes routes, controllers, and middlewares. Routes define the system endpoints, middlewares handle request validation and authentication, and controllers coordinate incoming requests by invoking the appropriate business logic.

The Business Layer contains the core logic of the system. The services module implements application-level operations such as email and OTP handling, while the listing domain module encapsulates listing-related functionality. Supporting components such as uploads and utilities provide reusable functionality.

The Data Layer is responsible for data management and persistence. Models define the structure of the system entities, config manages environment and database connections, and the database module contains schema definitions and setup logic.

Additionally, the Project Support components such as scripts and tests assist in development and testing but are not part of the runtime system.

Dependencies follow a top-down flow from the Presentation Layer to the Data Layer. Each layer depends only on the layer directly below it, ensuring a clean separation of concerns and improving maintainability, scalability, and testability of the system.

## 8. Physical Architecture

The Physical Architecture section was omitted because Roommie uses a simple single-server deployment and does not involve complex infrastructure or distributed components. For this project, the software and process views already describe the runtime environment sufficiently, so a separate physical view would add little new insight.

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
persistence consistency 


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

### Maintainability

The system uses a layered backend and grouped frontend modules, which makes responsibilities clearer and reduces duplication.

### Modifiability

New filters, profile fields, and listing features can be added with limited impact on unrelated modules.

### Usability

The system provides direct page-based flows for:
- signup
- login
- browse
- post listing
- edit listing
- save listing
- manage profile

### Security

Security mechanisms include:
- password hashing with bcrypt
- JWT-based authentication
- OTP verification for sensitive flows
- route protection for authenticated actions
- server-side validation
- parameterized SQL queries

### Reliability

The system uses structured validation, normalized persistence, image cleanup logic, and automated tests for important service flows.

### Simplicity

The architecture avoids unnecessary systems such as chat, payments, and advanced external integration, keeping the design suitable for a student project.


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



