import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/wallet_bloc.dart';
import '../bloc/wallet_event.dart';
import '../bloc/wallet_state.dart';
import '../../../core/widgets/glass_drawer.dart';

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
  final _depositAmountController = TextEditingController();
  final _transferAmountController = TextEditingController();

  String _depositNetwork = 'TRC-20';
  String _withdrawNetwork = 'TRC-20';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<WalletBloc>().add(WalletFetchRequested());
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
    _depositAmountController.dispose();
    _transferAmountController.dispose();
    super.dispose();
  }

  void _submitDeposit(BuildContext context) {
    final amountText = _depositAmountController.text.trim();
    final txHash = _txHashController.text.trim();

    if (amountText.isEmpty || double.tryParse(amountText) == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid deposit amount')),
      );
      return;
    }
    if (txHash.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the transaction hash')),
      );
      return;
    }

    context.read<WalletBloc>().add(
          WalletDepositRequested(
            amount: double.parse(amountText),
            network: _depositNetwork,
            txHash: txHash,
            note: 'USDT Deposit via Mobile App',
          ),
        );
  }

  void _submitWithdraw(BuildContext context) {
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

    context.read<WalletBloc>().add(
          WalletWithdrawalRequested(
            amount: amount,
            address: address,
            network: _withdrawNetwork,
            note: 'Withdrawal requested via Mobile',
          ),
        );
  }

  void _showTransferDialog(BuildContext context, double maxAmount) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Transfer Winnings'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Move your match winnings to deposit balance. Available: \$${maxAmount.toStringAsFixed(2)}'),
              const SizedBox(height: 16),
              TextField(
                controller: _transferAmountController,
                decoration: const InputDecoration(
                  labelText: 'Amount (USDT)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('CANCEL'),
            ),
            ElevatedButton(
              onPressed: () {
                final amt = double.tryParse(_transferAmountController.text.trim());
                if (amt != null && amt > 0 && amt <= maxAmount) {
                  context.read<WalletBloc>().add(WalletTransferWinningsRequested(amount: amt));
                  Navigator.pop(ctx);
                  _transferAmountController.clear();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Invalid transfer amount')),
                  );
                }
              },
              child: const Text('TRANSFER'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: isSelected ? Colors.white : Colors.white60),
          Text(label, style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : Colors.white60)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      extendBody: true,
      extendBodyBehindAppBar: true,
      drawer: const GlassDrawer(),
      appBar: AppBar(
        title: const Text('USDT Portal', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.black.withOpacity(0.15)),
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'DEPOSIT', icon: Icon(Icons.download_rounded)),
            Tab(text: 'WITHDRAW', icon: Icon(Icons.upload_rounded)),
          ],
        ),
      ),
      bottomNavigationBar: ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF0F2027).withOpacity(0.9),
              border: Border(
                top: BorderSide(color: Colors.white.withOpacity(0.15), width: 1.5),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.home_rounded, 'Home', false, () {
                  Navigator.pushReplacementNamed(context, '/dashboard');
                }),
                _buildNavItem(Icons.wallet_rounded, 'Wallet', true, () {}),
              ],
            ),
          ),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0B0F19),
              Color(0xFF111827),
              Color(0xFF1F2937),
            ],
          ),
        ),
        child: Stack(
          children: [
            // Ambient Blobs
            Positioned(
              top: 50,
              left: -80,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primary.withOpacity(0.15),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
                  child: Container(color: Colors.transparent),
                ),
              ),
            ),
            Positioned(
              bottom: 120,
              right: -100,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.secondary.withOpacity(0.12),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
                  child: Container(color: Colors.transparent),
                ),
              ),
            ),
            SafeArea(
              child: BlocConsumer<WalletBloc, WalletState>(
                listener: (context, state) {
                  if (state is WalletActionSuccess) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(state.message),
                        backgroundColor: theme.colorScheme.primary,
                      ),
                    );
                    _txHashController.clear();
                    _depositAmountController.clear();
                    _addressController.clear();
                    _amountController.clear();
                  } else if (state is WalletFailure) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(state.message),
                        backgroundColor: theme.colorScheme.error,
                      ),
                    );
                  }
                },
                builder: (context, state) {
                  if (state is WalletLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state is WalletLoaded) {
                    final wallet = state.wallet;
                    final transactions = state.transactions;

                    return SingleChildScrollView(
                      padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0, bottom: 100.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Balances breakdown card
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.5),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    children: [
                                      const Text('Total Balance (USDT)', style: TextStyle(color: Colors.grey)),
                                      const SizedBox(height: 8),
                                      Text(
                                        '\$${wallet.totalUSDT.toStringAsFixed(2)}',
                                        style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                                      const Divider(height: 32, color: Colors.white24),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                                        children: [
                                          _buildBalanceItem('Deposits', wallet.depositBalance, theme.colorScheme.secondary),
                                          _buildBalanceItem('Winnings', wallet.winningsBalance, theme.colorScheme.primary),
                                          _buildBalanceItem('Locked', wallet.lockedBalance, Colors.grey),
                                        ],
                                      ),
                                      if (wallet.winningsBalance > 0) ...[
                                        const SizedBox(height: 16),
                                        ElevatedButton.icon(
                                          onPressed: () => _showTransferDialog(context, wallet.winningsBalance),
                                          icon: const Icon(Icons.swap_horiz_rounded),
                                          label: const Text('TRANSFER WINNINGS TO DEPOSITS'),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Forms Tab view
                          SizedBox(
                            height: 340,
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                // Deposit Panel
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const Text('USDT Smart Contract Address (TRC-20/ERC-20)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                                      ),
                                      child: Row(
                                        children: const [
                                          Icon(Icons.vpn_key, color: Colors.amber),
                                          SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              'TY8j9...8xK9w',
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(fontFamily: 'monospace', color: Colors.white),
                                            ),
                                          ),
                                          Icon(Icons.copy, color: Colors.grey, size: 18),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: TextField(
                                            controller: _depositAmountController,
                                            style: const TextStyle(color: Colors.white),
                                            decoration: InputDecoration(
                                              labelText: 'Amount (USDT)',
                                              labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(color: theme.colorScheme.primary),
                                              ),
                                            ),
                                            keyboardType: TextInputType.number,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        DropdownButton<String>(
                                          value: _depositNetwork,
                                          dropdownColor: const Color(0xFF1F2937),
                                          style: const TextStyle(color: Colors.white),
                                          items: const [
                                            DropdownMenuItem(value: 'TRC-20', child: Text('TRC-20')),
                                            DropdownMenuItem(value: 'ERC-20', child: Text('ERC-20')),
                                          ],
                                          onChanged: (val) {
                                            if (val != null) setState(() => _depositNetwork = val);
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    TextField(
                                      controller: _txHashController,
                                      style: const TextStyle(color: Colors.white),
                                      decoration: InputDecoration(
                                        labelText: 'Blockchain Transaction Hash (txHash)',
                                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: theme.colorScheme.primary),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton(
                                      onPressed: () => _submitDeposit(context),
                                      child: const Text('SUBMIT DEPOSIT'),
                                    ),
                                  ],
                                ),

                                // Withdraw Panel
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const Text('Request USDT Payout', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: TextField(
                                            controller: _amountController,
                                            style: const TextStyle(color: Colors.white),
                                            decoration: InputDecoration(
                                              labelText: 'Amount to Withdraw',
                                              labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(12),
                                                borderSide: BorderSide(color: theme.colorScheme.primary),
                                              ),
                                            ),
                                            keyboardType: TextInputType.number,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        DropdownButton<String>(
                                          value: _withdrawNetwork,
                                          dropdownColor: const Color(0xFF1F2937),
                                          style: const TextStyle(color: Colors.white),
                                          items: const [
                                            DropdownMenuItem(value: 'TRC-20', child: Text('TRC-20')),
                                            DropdownMenuItem(value: 'ERC-20', child: Text('ERC-20')),
                                          ],
                                          onChanged: (val) {
                                            if (val != null) setState(() => _withdrawNetwork = val);
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    TextField(
                                      controller: _addressController,
                                      style: const TextStyle(color: Colors.white),
                                      decoration: InputDecoration(
                                        labelText: 'Recipient USDT Address',
                                        labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: Colors.white.withOpacity(0.2)),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(color: theme.colorScheme.primary),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton(
                                      onPressed: () => _submitWithdraw(context),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: theme.colorScheme.secondary,
                                      ),
                                      child: const Text('REQUEST PAYOUT'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                  // Transaction History Section
                  const SizedBox(height: 24),
                  const Text(
                    'Transaction History',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  transactions.isEmpty
                      ? const Center(child: Text('No transactions yet.'))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: transactions.length,
                          itemBuilder: (ctx, index) {
                            final tx = transactions[index];
                            final isPlus = tx.type == 'deposit' || tx.type == 'win' || tx.type == 'refund';
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isPlus ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                                child: Icon(
                                  isPlus ? Icons.arrow_downward : Icons.arrow_upward,
                                  color: isPlus ? Colors.green : Colors.red,
                                ),
                              ),
                              title: Text('${tx.type.toUpperCase()} - ${tx.status.toUpperCase()}'),
                              subtitle: Text(tx.createdAt.toLocal().toString().substring(0, 16)),
                              trailing: Text(
                                '${isPlus ? '+' : '-'}\$${tx.amount.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isPlus ? Colors.green : Colors.red,
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
            );
          }

          return const Center(child: Text('Could not fetch wallet data'));
        },
      ),
    ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceItem(String label, double val, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        const SizedBox(height: 4),
        Text(
          '\$${val.toStringAsFixed(2)}',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }
}
