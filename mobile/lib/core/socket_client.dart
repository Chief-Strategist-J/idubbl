import 'package:socket_io_client/socket_io_client.dart' as io;
import 'constants.dart';

class SocketClient {
  static final SocketClient _instance = SocketClient._internal();
  io.Socket? _socket;

  factory SocketClient() {
    return _instance;
  }

  SocketClient._internal();

  io.Socket get socket {
    if (_socket == null) {
      _socket = io.io(
        AppConstants.baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .disableAutoConnect()
            .build(),
      );
    }
    return _socket!;
  }

  void connect(String userId) {
    print('SOCKET: Connecting to ${AppConstants.baseUrl} with userId=$userId');
    
    // Disconnect and clean up the old socket connection to avoid duplicate listeners 
    // and guarantee the query parameter is updated.
    disconnect();

    _socket = io.io(
      AppConstants.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setQuery({'userId': userId})
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      print('SOCKET STATUS: Connected successfully. ID: ${_socket?.id}');
    });

    _socket!.onConnectError((err) {
      print('SOCKET STATUS: Connection Error: $err');
    });

    _socket!.onError((err) {
      print('SOCKET STATUS: Error: $err');
    });

    _socket!.onDisconnect((reason) {
      print('SOCKET STATUS: Disconnected. Reason: $reason');
    });

    _socket!.connect();
  }

  void disconnect() {
    if (_socket != null) {
      print('SOCKET: Explicitly disconnecting...');
      _socket!.disconnect();
      _socket = null;
    }
  }
}
