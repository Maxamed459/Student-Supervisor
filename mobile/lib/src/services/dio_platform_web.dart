import 'package:dio/browser.dart';
import 'package:dio/dio.dart';

void configureDioPlatform(Dio dio) {
  dio.httpClientAdapter = BrowserHttpClientAdapter()..withCredentials = true;
}
