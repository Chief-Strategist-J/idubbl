import 'package:flutter/material.dart';
import 'screens/login.dart';
import 'screens/dashboard.dart';
import 'screens/wallet.dart';
import 'screens/game.dart';

void main() {
  runApp(const IDubblApp());
}

class IDubblApp extends StatelessWidget {
  const IDubblApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'iDubbl Platform',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF00E676), // Neon Green
        scaffoldBackgroundColor: const Color(0xFF0A0E17), // Deep Dark Blue
        cardColor: const Color(0xFF151D2A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00E676),
          secondary: Color(0xFF00B0FF), // Neon Blue
          surface: Color(0xFF151D2A),
          background: const Color(0xFF0A0E17),
          error: Color(0xFFFF1744),
        ),
        fontFamily: 'Roboto',
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 32.0, fontWeight: FontWeight.bold, color: Colors.white),
          titleLarge: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold, color: Colors.white),
          bodyLarge: TextStyle(fontSize: 16.0, color: Color(0xFF90A4AE)),
          bodyMedium: TextStyle(fontSize: 14.0, color: Color(0xFF90A4AE)),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0A0E17),
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(fontSize: 20.0, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00E676),
            foregroundColor: const Color(0xFF0A0E17),
            textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/wallet': (context) => const WalletScreen(),
        '/game': (context) => const GameScreen(),
      },
    );
  }
}
