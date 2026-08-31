/// Central API base-URL configuration for the Flutter client.
///
/// Architecture: Flutter APK → HTTPS public API → Express → MongoDB
///
/// Production backend (Railway):
/// `https://api-student-supervisor.up.railway.app/api`
library;

class ApiConfig {
  ApiConfig._();

  /// Production Railway API — used by default in debug and release.
  static const railwayApiUrl =
      'https://api-student-supervisor.up.railway.app/api';

  /// Optional build-time override:
  /// `flutter build apk --dart-define=API_URL=https://.../api`
  static const _overrideUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: '',
  );

  /// Resolved base URL for Dio and all `/api` calls.
  static String get baseUrl {
    final raw = _overrideUrl.trim().isEmpty ? railwayApiUrl : _overrideUrl;
    return _normalize(raw);
  }

  static String _normalize(String url) {
    var value = url.trim();
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }

  static bool _isPrivateOrLocalHost(String host) {
    final h = host.toLowerCase();
    if (h == 'localhost' ||
        h == '127.0.0.1' ||
        h == '0.0.0.0' ||
        h == '::1' ||
        h.endsWith('.local')) {
      return true;
    }
    // Android emulator host loopback — not valid for production APKs.
    if (h == '10.0.2.2') return true;

    final parts = h.split('.');
    if (parts.length == 4) {
      final octets = parts.map(int.tryParse).toList();
      if (octets.any((o) => o == null || o < 0 || o > 255)) return false;
      final a = octets[0]!;
      final b = octets[1]!;
      if (a == 10) return true;
      if (a == 172 && b >= 16 && b <= 31) return true;
      if (a == 192 && b == 168) return true;
      if (a == 127) return true;
    }
    return false;
  }

  /// Call once at startup. Rejects non-HTTPS and local/private hosts.
  static void validateForRuntime() {
    final url = baseUrl;
    final uri = Uri.tryParse(url);

    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw StateError('Invalid API_URL: "$url"');
    }

    if (uri.scheme != 'https') {
      throw StateError('API_URL must use HTTPS. Got: "$url"');
    }

    if (_isPrivateOrLocalHost(uri.host)) {
      throw StateError(
        'API_URL must be a public host, not localhost or a local IP. Got: "$url"',
      );
    }
  }
}
