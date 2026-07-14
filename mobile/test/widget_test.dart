import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/features/auth/presentation/login_screen.dart';
import 'package:mobile/features/auth/bloc/auth_bloc.dart';
import 'package:mobile/features/auth/bloc/auth_state.dart';
import 'package:mobile/core/api_client.dart';

void main() {
  testWidgets('LoginScreen renders fields and ENTER ARENA button', (WidgetTester tester) async {
    final apiClient = ApiClient();
    final authBloc = AuthBloc(apiClient: apiClient);

    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<AuthBloc>.value(
          value: authBloc,
          child: const LoginScreen(),
        ),
      ),
    );
    await tester.pump();

    // Verify login UI components are present in initial state
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('iDubbl'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2)); // Email & Password
    expect(find.text('ENTER ARENA'), findsOneWidget);

    // Clean up
    authBloc.close();
  });
}
