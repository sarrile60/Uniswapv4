#!/usr/bin/env python3
"""
Debug script to test transaction generation with fees
"""

import sys
sys.path.append('/app/backend')

from transaction_generator import generate_transaction_history
from decimal import Decimal

# Test generating transactions with total_fees=8000
print("Generating transaction history with total_fees=8000")
print("=" * 80)

transactions = generate_transaction_history(
    user_id="test-user-id",
    wallet_id="test-wallet-id",
    total_balance="50000",
    total_fees="8000",
    start_date="2024-01-01",
    end_date="2024-06-01",
    asset="USDC"
)

print(f"Number of transactions generated: {len(transactions)}")
print()

# Calculate total fees
total_fees = sum(Decimal(tx["fee"]) for tx in transactions)
print(f"Total fees from transactions: ${total_fees}")
print(f"Expected total fees: $8000")
print(f"Match: {total_fees == Decimal('8000')}")
print()

# Show fee distribution
fees = [Decimal(tx["fee"]) for tx in transactions]
print(f"Min fee: ${min(fees)}")
print(f"Max fee: ${max(fees)}")
print(f"Average fee: ${total_fees / len(fees):.2f}")
print()

# Show all fees
print("All fees:")
for i, tx in enumerate(transactions, 1):
    print(f"  {i}. {tx['type']:10s} - Fee: ${tx['fee']:>8s}")
