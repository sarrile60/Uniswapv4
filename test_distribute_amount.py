#!/usr/bin/env python3
"""Test the distribute_amount function to verify it sums correctly"""

import sys
sys.path.append('/app/backend')

from transaction_generator import distribute_amount
from decimal import Decimal

# Test 1: Distribute 8000 across 20 parts with min_amount=0.50
print("Test 1: Distribute $8000 across 20 parts with min_amount=0.50")
parts = distribute_amount(Decimal("8000"), 20, min_amount=Decimal("0.50"))
total = sum(parts)
print(f"Parts: {[str(p) for p in parts]}")
print(f"Sum: ${total}")
print(f"Expected: $8000")
print(f"Match: {total == Decimal('8000')}")
print()

# Test 2: Distribute 8000 across 19 parts (excluding failed withdrawal)
print("Test 2: Distribute $8000 across 19 parts with min_amount=0.50")
parts = distribute_amount(Decimal("8000"), 19, min_amount=Decimal("0.50"))
total = sum(parts)
print(f"Parts: {[str(p) for p in parts]}")
print(f"Sum: ${total}")
print(f"Expected: $8000")
print(f"Match: {total == Decimal('8000')}")
print()

# Test 3: Multiple runs to check consistency
print("Test 3: Multiple runs to check consistency")
for i in range(5):
    parts = distribute_amount(Decimal("8000"), 20, min_amount=Decimal("0.50"))
    total = sum(parts)
    print(f"Run {i+1}: Sum = ${total}, Match = {total == Decimal('8000')}")
