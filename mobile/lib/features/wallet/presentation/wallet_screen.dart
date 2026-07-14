import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/wallet_bloc.dart';
import '../bloc/wallet_event.dart';
import '../bloc/wallet_state.dart';

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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('USDT Portal'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          tabs: const [
            Tab(text: 'DEPOSIT', icon: Icon(Icons.download_rounded)),
            Tab(text: 'WITHDRAW', icon: Icon(Icons.upload_rounded)),
          ],
        ),
      ),
      body: BlocConsumer<WalletBloc, WalletState>(
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
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Balances breakdown card
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: theme.colorScheme.primary.withOpacity(0.2)),
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
                          const Divider(height: 32),
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
                            const Text('USDT Smart Contract Address (TRC-20/ERC-20)', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.cardColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: const [
                                  Icon(Icons.vpn_key, color: Colors.amber),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'TY8j9...8xK9w',
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontFamily: 'monospace'),
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
                                    decoration: const InputDecoration(
                                      labelText: 'Amount (USDT)',
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                DropdownButton<String>(
                                  value: _depositNetwork,
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
                              decoration: const InputDecoration(
                                labelText: 'Blockchain Transaction Hash (txHash)',
                                border: OutlineInputBorder(),
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
                            const Text('Request USDT Payout', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _amountController,
                                    decoration: const InputDecoration(
                                      labelText: 'Amount to Withdraw',
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                DropdownButton<String>(
                                  value: _withdrawNetwork,
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
                              decoration: const InputDecoration(
                                labelText: 'Recipient USDT Address',
                                border: OutlineInputBorder(),
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
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
