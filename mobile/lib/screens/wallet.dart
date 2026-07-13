import 'package:flutter/material.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _txHashController = TextEditingController();
  final _addressController = TextEditingController();
  final _amountController = TextEditingController();
  String _depositNetwork = 'TRC-20';
  String _withdrawNetwork = 'TRC-20';
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as String?;
    if (args == 'withdraw') {
      _tabController.animateTo(1);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _txHashController.dispose();
    _addressController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _submitDeposit() {
    if (_txHashController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the transaction hash')),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    // Simulate Tx Verification via API
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Transaction submitted! Awaiting nodes confirmation...'),
            backgroundColor: Color(0xFF00E676),
          ),
        );
        _txHashController.clear();
      }
    });
  }

  void _submitWithdraw() {
    final address = _addressController.text.trim();
    final amountText = _amountController.text.trim();

    if (address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter wallet address')),
      );
      return;
    }

    final amount = double.tryParse(amountText);
    if (amount == null || amount < 1.0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Minimum withdrawal is 1 USDT'),
          backgroundColor: Color(0xFFFF1744),
        ),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payout request of $amount USDT registered successfully!'),
            backgroundColor: const Color(0xFF00E676),
          ),
        );
        _addressController.clear();
        _amountController.clear();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('USDT Portal'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'DEPOSIT FUNDS', icon: Icon(Icons.download)),
            Tab(text: 'WITHDRAW', icon: Icon(Icons.upload)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Deposit Tab
          _buildDepositTab(theme),
          // Withdraw Tab
          _buildWithdrawTab(theme),
        ],
      ),
    );
  }

  Widget _buildDepositTab(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Network Selector
          const Text(
            'Select Blockchain Network',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildNetworkButton('TRC-20', _depositNetwork, (val) {
                setState(() => _depositNetwork = val);
              }),
              const SizedBox(width: 12),
              _buildNetworkButton('ERC-20', _depositNetwork, (val) {
                setState(() => _depositNetwork = val);
              }),
            ],
          ),
          const SizedBox(height: 32),

          // QR Code simulation
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Icons.qr_code_2_sharp,
                size: 200,
                color: theme.scaffoldBackgroundColor,
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Address copy section
          const Text(
            'Your Deposit Wallet Address',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _depositNetwork == 'TRC-20'
                        ? 'TY3k5XJg2U9N87v2n5Y4tRe8eQW12d'
                        : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy, color: Color(0xFF00E676)),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Address copied to clipboard!')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Verification Field
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Verify Transaction',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Submit the transaction hash (TxHash) after sending USDT on the network to credit your balance.',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _txHashController,
                  decoration: InputDecoration(
                    labelText: 'Transaction Hash (TxHash)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                _isProcessing
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: _submitDeposit,
                        child: const Text('SUBMIT HASH'),
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawTab(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Available Balance Info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.colorScheme.primary.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Settled Balance:',
                  style: TextStyle(color: Colors.white70),
                ),
                Text(
                  '245.50 USDT',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Network Selector
          const Text(
            'Blockchain Network',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildNetworkButton('TRC-20', _withdrawNetwork, (val) {
                setState(() => _withdrawNetwork = val);
              }),
              const SizedBox(width: 12),
              _buildNetworkButton('ERC-20', _withdrawNetwork, (val) {
                setState(() => _withdrawNetwork = val);
              }),
            ],
          ),
          const SizedBox(height: 24),

          // Address field
          TextField(
            controller: _addressController,
            decoration: InputDecoration(
              labelText: 'Recipient Wallet Address',
              helperText: 'Send only USDT to this address on the chosen network.',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Amount field
          TextField(
            controller: _amountController,
            decoration: InputDecoration(
              labelText: 'USDT Amount',
              helperText: 'Minimum limit: 1 USDT',
              suffixText: 'USDT',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 32),

          // Withdraw Button
          _isProcessing
              ? const Center(child: CircularProgressIndicator())
              : ElevatedButton(
                  onPressed: _submitWithdraw,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.black,
                  ),
                  child: const Text('SUBMIT WITHDRAWAL REQUEST'),
                ),
        ],
      ),
    );
  }

  Widget _buildNetworkButton(String label, String activeValue, ValueChanged<String> onTap) {
    final isActive = label == activeValue;
    final theme = Theme.of(context);
    return Expanded(
      child: OutlinedButton(
        onPressed: () => onTap(label),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isActive ? theme.colorScheme.primary : Colors.white12,
            width: 1.5,
          ),
          backgroundColor: isActive ? theme.colorScheme.primary.withOpacity(0.05) : Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? theme.colorScheme.primary : Colors.white60,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
