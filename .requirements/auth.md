# Feature: Authentication

## User Story
As a user, I want to sign in with email and password so that I can access protected features.

## Acceptance Criteria

### AC1: Successful Login
**Given** I am on the login page
**When** I enter valid email and password
**Then** I am redirected to the home page and my session is established

### AC2: Invalid Credentials
**Given** I am on the login page
**When** I enter an incorrect email or password
**Then** I see an error message "Invalid login credentials"

### AC3: Validation Errors
**Given** I am on the login page
**When** I submit the form with an invalid email format
**Then** I see "Invalid email" validation error before the form is submitted

### AC4: Password Minimum Length
**Given** I am on the login page
**When** I enter a password shorter than 8 characters
**Then** I see "Password must be at least 8 characters" error

### AC5: Logout
**Given** I am authenticated
**When** I trigger logout
**Then** My session is cleared and I am redirected to the login page

### AC6: Protected Route Guard
**Given** I am not authenticated
**When** I navigate to any protected route
**Then** I am redirected to the login page

## Test Cases
- [ ] TC1: Valid credentials → redirect to home
- [ ] TC2: Wrong password → error message
- [ ] TC3: Empty email → validation error
- [ ] TC4: Invalid email format → validation error
- [ ] TC5: Short password → validation error
- [ ] TC6: Logout → redirect to login
- [ ] TC7: Unauthenticated → redirect to login

## Out of Scope
- Social OAuth (Google, GitHub) — can be added later
- Password reset flow — future enhancement
- MFA — future enhancement
