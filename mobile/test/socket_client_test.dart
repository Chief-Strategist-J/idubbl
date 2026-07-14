import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/socket_client.dart';
import 'package:mobile/core/constants.dart';

void main() {
  group('SocketClient Tests', () {
    late SocketClient socketClient;

    setUp(() {
      socketClient = SocketClient();
    });

    tearDown(() {
      socketClient.disconnect();
    });

    test('SocketClient is a singleton', () {
      final client1 = SocketClient();
      final client2 = SocketClient();
      expect(identical(client1, client2), isTrue);
    });

    test('connect instantiates socket with correct query and transports options', () {
      const testUserId = 'user_12345';
      socketClient.connect(testUserId);

      final socket = socketClient.socket;
      expect(socket, isNotNull);

      // Verify that options include correct query and transport settings
      final options = socket.io.options;
      expect(options, isNotNull);
      expect(options!['transports'], containsAll(['websocket', 'polling']));
      expect(options['query'], equals('userId=$testUserId'));
    });

    test('disconnect clears socket instance', () {
      socketClient.connect('user_temp');
      expect(socketClient.socket, isNotNull);

      socketClient.disconnect();
      // Accessing socket after disconnect should initialize a fresh default socket
      final freshSocket = socketClient.socket;
      expect(freshSocket, isNotNull);
      expect(freshSocket.connected, isFalse);
    });
  });
}
