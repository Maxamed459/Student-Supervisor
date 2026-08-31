# SSMS Flutter (Student Supervisor Mobile)

Mobile client for Admin, Supervisor, and Student.

```
Flutter APK → HTTPS Railway API → Express → MongoDB
```

## Production API

**`https://api-student-supervisor.up.railway.app/api`**

Configured in `lib/src/config/api_config.dart` (`ApiConfig.railwayApiUrl`).
All Dio requests use this URL. Localhost, `127.0.0.1`, and private LAN IPs are
rejected at startup.

## Release APK

```bash
cd mobile
flutter pub get
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

The release APK works on any phone with internet access while the Railway
backend is online. No laptop IP or local network required.

Optional explicit URL (must still be public HTTPS):

```bash
flutter build apk --release --dart-define=API_URL=https://api-student-supervisor.up.railway.app/api
```
