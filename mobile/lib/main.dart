import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/api_client.dart';
import 'core/socket_client.dart';
import 'features/auth/bloc/auth_bloc.dart';
import 'features/auth/bloc/auth_event.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/auth/presentation/verify_screen.dart';
import 'features/wallet/bloc/wallet_bloc.dart';
import 'features/wallet/presentation/wallet_screen.dart';
import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/game/bloc/game_bloc.dart';
import 'features/game/presentation/game_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const IDubblApp());
}

class IDubblApp extends StatefulWidget {
  const IDubblApp({super.key});

  @override
  State<IDubblApp> createState() => _IDubblAppState();
}

class _IDubblAppState extends State<IDubblApp> {
  final ApiClient _apiClient = ApiClient();
  final SocketClient _socketClient = SocketClient();

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(apiClient: _apiClient)..add(AuthCheckSession()),
        ),
        BlocProvider<WalletBloc>(
          create: (context) => WalletBloc(apiClient: _apiClient),
        ),
        BlocProvider<GameBloc>(
          create: (context) => GameBloc(socketClient: _socketClient),
        ),
      ],
      child: MaterialApp(
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
            background: Color(0xFF0A0E17),
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
          '/register': (context) => const RegisterScreen(),
          '/verify': (context) => const VerifyScreen(),
          '/dashboard': (context) => const DashboardScreen(),
          '/wallet': (context) => const WalletScreen(),
          '/game': (context) => const GameScreen(),
        },
      ),
    );
  }
}
