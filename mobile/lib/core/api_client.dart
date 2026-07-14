import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ApiClient {
  final http.Client _client = http.Client();

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.bearerTokenKey);
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<http.Response> get(String path) async {
    final uri = Uri.parse(path);
    final headers = await _getHeaders();
    return await _client.get(uri, headers: headers);
  }

  Future<http.Response> post(String path, Map<String, dynamic> body, {Map<String, String>? extraHeaders}) async {
    final uri = Uri.parse(path);
    final headers = await _getHeaders();
    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return await _client.post(
      uri,
      headers: headers,
      body: jsonEncode(body),
    );
  }

  Future<http.Response> delete(String path) async {
    final uri = Uri.parse(path);
    final headers = await _getHeaders();
    return await _client.delete(uri, headers: headers);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.bearerTokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.bearerTokenKey);
    await prefs.remove(AppConstants.userRoleKey);
    await prefs.remove(AppConstants.loginPortalKey);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.bearerTokenKey);
  }
}
