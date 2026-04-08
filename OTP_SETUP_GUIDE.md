# 🚀 Twilio SMS OTP Integration Setup Guide

## ✅ What's Been Implemented

Your application now has **Twilio SMS integration** for:

- ✅ Registration OTP delivery
- ✅ Login OTP delivery
- ✅ Automatic failover to console logging for testing
- ✅ Error handling and logging

---

## 📋 Get Twilio Credentials (5 minutes)

### 1. Create a Twilio Account

- Go to [Twilio Console](https://www.twilio.com/console)
- Sign up for a free account
- Verify your email and phone number

### 2. Get Your Credentials

Inside your Twilio Dashboard, find:

**Account SID:**

```
Located in Dashboard > Account Info
Example: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Auth Token:**

```
Located in Dashboard > Account Info (click "View")
Example: 1234567890abcdefghijklmnopqrs
```

### 3. Get a Twilio Phone Number

- Go to **Phone Numbers** > **Buy a Number**
- Select your country
- Choose a number (costs $1.15/month)
- Complete purchase
- You'll get a number like: `+1234567890`

---

## 🔧 Configuration

### Update `.env` file

Edit `backend/.env`:

```env
PORT=5000
GOOGLE_SHEET_ID=1YT_NMDDzvyLtsKdR1eSWHIuqaffx4BjzaCDjyGj_yOM
MONGO_URL=mongodb+srv://admin:admin@cluster0.rpragzx.mongodb.net/valuation?appName=Cluster0

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdefghijklmnopqrs
TWILIO_AUTH_TOKEN=your_full_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_me
JWT_EXPIRES_IN=7d
```

---

## 🧪 Test Mode (Without Twilio)

The system will automatically **fall back to console logging** if:

- Twilio credentials are not configured in `.env`
- You want to test without real SMS

**In console, you'll see:**

```
============================================================
📱 TEST OTP - Console Mode
============================================================
Phone: 7039370476
OTP: 123456
Message: Your ERAISED OTP is: 123456. Valid for 5 minutes.
============================================================
```

---

## ✨ Features

### Automatic Phone Number Formatting

- Accepts: `7039370476` → Converts to `+917039370476` (India format)
- Accepts: `+917039370476` → Uses as-is

### OTP Message Format

```
Your ERAISED OTP is: 123456. Valid for 5 minutes. Do not share with anyone.
```

### Security

- OTP expires in 5 minutes
- OTP marked as used after verification
- Logs sensitive data only in development

### Error Handling

- If SMS fails, OTP still saved in database
- User can retry sending OTP
- Detailed console logging for debugging

---

## 📱 For India Users

If using Indian numbers (91XXXXXXXXXX):

### Alternative Providers (Optional)

Instead of Twilio, you can use:

- **MSG91** - Popular in India
- **Exotel** - India-focused
- **Kaleyra** - Multiple regions

To switch providers, update `backend/src/services/smsService.js`

---

## 🔄 How It Works

### Registration Flow with OTP

1. User fills form → Registration started
2. User answers 14 questions → Answers saved
3. Click "Submit & Verify" → SMS OTP sent ✉️
4. User enters OTP code → Verified ✓
5. User logged in & shown results

### Login Flow with OTP

1. Enter mobile number → User found
2. "Send OTP" clicked → SMS sent ✉️
3. Enter OTP code → Verified ✓
4. User logged in

---

## 🛠️ Troubleshooting

### Issue: "Twilio not configured"

**Solution:** Update `.env` with valid credentials

### Issue: SMS not received

**Troubleshooting:**

1. Check console for OTP code
2. Verify phone number format (with +91 for India)
3. Check Twilio account has credits/is not suspended
4. Check Twilio phone number is verified

### Issue: "Invalid phone number"

**Solution:** Ensure number is in SQL format:

- Correct: `7039370476` or `+917039370476`
- Wrong: `91-7039370476`

### Check Twilio Logs

- Go to Twilio Console > Monitor > Logs > Messaging
- See which SMS succeeded/failed

---

## 📊 Usage Costs

**Twilio Pricing (approx):**

- Incoming SMS: $0.0075 per SMS
- Outgoing SMS: $0.0075-$0.012 per SMS
- Phone number: $1.15 per month

**Free Trial:** $15 credit (good for testing ~2000 SMS)

---

## 🔐 Security Best Practices

✅ Do:

- Keep `.env` file in `.gitignore`
- Never commit credentials to GitHub
- Use environment variables in production
- Rotate auth tokens periodically

❌ Don't:

- Share your Auth Token
- Hardcode credentials in code
- Use same token in multiple environments

---

## 📞 Support

For Twilio support:

- Visit: https://support.twilio.com
- Email: support@twilio.com
- Phone: +1-844-839-4874

---

## ✅ Next Steps

1. **Get Twilio Account** → Sign up at twilio.com
2. **Get Credentials** → Copy SID, Token, Phone Number
3. **Update .env** → Paste credentials
4. **Restart Backend** → `npm start`
5. **Test Registration** → Submit form & check SMS

**Done! Your OTP service is live!** 🎉
