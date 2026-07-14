import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;

void main() async {
  print('Starting real socket connection test to Render...');
  
  final socket = io.io(
    'https://idubbl-backend.onrender.com',
    io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .disableAutoConnect()
        .build(),
  );

  final completer = Completer<void>();

  socket.onConnect((_) {
    print('SUCCESS: Connected to Render backend! Socket ID: ${socket.id}');
    socket.disconnect();
    completer.complete();
  });

  socket.onConnectError((err) {
    print('ERROR: Connection Error: $err');
    completer.complete();
  });

  socket.onError((err) {
    print('ERROR: Socket Error: $err');
    completer.complete();
  });

  socket.onDisconnect((reason) {
    print('INFO: Disconnected. Reason: $reason');
  });

  print('Connecting...');
  socket.connect();

  // Wait up to 15 seconds
  await completer.future.timeout(const Duration(seconds: 15), onTimeout: () {
    print('TIMEOUT: Socket connection timed out.');
    socket.disconnect();
  });
}
