# WordPress Signup API

## Purpose

Use this API when a user registers from a WordPress form, ad campaign, landing page, or QR code before the event.

This endpoint creates the user directly in the main `users` collection so the user can later log in with:

- `email`
- `mobile number`

No assessment is submitted in this step.

## Endpoint

`POST /api/register/signup`

Example local URL:

`http://localhost:5000/api/register/signup`

Example production URL:

`https://YOUR_BACKEND_DOMAIN/api/register/signup`

## Required Fields

- `fname`
- `lname`
- `companyName`
- `email`
- `contact`

## Optional Fields

- `approximateTurnover`
- `teamSize`
- `companySize`
- `companyLocation`
- `companyIndustry`
- `businessType`
- `productsServices`

## Request Headers

```http
Content-Type: application/json
```

## Request Body

```json
{
  "fname": "Shubham",
  "lname": "Makwana",
  "companyName": "Zybrio",
  "email": "shubhammakwana307@gmail.com",
  "contact": "9867468693",
  "approximateTurnover": "10 crore to 50 crore",
  "teamSize": "11-30",
  "companySize": "",
  "companyLocation": "",
  "companyIndustry": "",
  "businessType": "Software Development",
  "productsServices": "NA"
}
```

## Success Response

Status: `201 Created`

```json
{
  "success": true,
  "message": "Signup completed successfully",
  "data": {
    "userId": "ERTI000021",
    "fname": "Shubham",
    "lname": "Makwana",
    "companyName": "Zybrio",
    "email": "shubhammakwana307@gmail.com",
    "contact": "9867468693",
    "attemptsRemaining": 3
  }
}
```

## Duplicate User Response

Status: `409 Conflict`

Returned when either the email or mobile number already exists.

```json
{
  "success": false,
  "message": "User already exists. Please login."
}
```

## Validation Errors

Status: `400 Bad Request`

Examples:

```json
{
  "success": false,
  "message": "fname, lname, companyName, email and contact are required"
}
```

```json
{
  "success": false,
  "message": "Invalid email format"
}
```

```json
{
  "success": false,
  "message": "Invalid mobile number format"
}
```

## What This API Does

- Creates a user directly in the `users` collection
- Sets total attempts to `3`
- Sets `assessmentAttemptsCount` to `0`
- Sets `attemptsRemaining` to `3`
- Does not submit assessment answers
- Does not create a Google Sheet assessment row

## What Happens Later

After signup from WordPress:

1. User comes to the real event
2. User logs in with `email + mobile`
3. User starts assessment
4. First assessment submission reduces attempts from `3` to `2`

## Current Login Contract

Login expects:

- `email`
- `mobile`

It does not use company name anymore.
