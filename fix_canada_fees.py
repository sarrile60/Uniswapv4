"""
Fix existing transactions for a Canada user where fees were incorrectly
set to 0.50 each due to the transaction_generator bug.

Run on VPS: python3 /opt/uniswapv4/fix_canada_fees.py
"""
import asyncio
import os
import random
from decimal import Decimal, ROUND_HALF_UP
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'uniswapv4-canada'
USER_EMAIL = 'andrewy828@gmail.com'


def distribute_fees(total: Decimal, num_parts: int) -> list:
    """Distribute total fee across num_parts with realistic variation."""
    if num_parts <= 0:
        return []
    if num_parts == 1:
        return [total]

    min_amount = Decimal('0.50')
    # If total too small to distribute properly, concentrate in one tx
    if total < min_amount * num_parts:
        result = [Decimal('0.00')] * num_parts
        result[0] = total
        return result

    parts = []
    remaining = total
    for i in range(num_parts - 1):
        avg = remaining / (num_parts - i)
        variation = Decimal(str(random.uniform(0.5, 1.5)))
        amount = (avg * variation).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        amount = max(min_amount, min(amount, remaining - min_amount * (num_parts - i - 1)))
        parts.append(amount)
        remaining -= amount

    parts.append(remaining.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    random.shuffle(parts)
    return parts


async def fix_user_fees():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Find user
    user = await db.users.find_one({'email': USER_EMAIL}, {'_id': 0})
    if not user:
        print(f"❌ User {USER_EMAIL} not found in {DB_NAME}")
        return

    admin_set_fees = Decimal(str(user.get('total_unpaid_fees', '0') or '0'))
    print(f"✅ Found user: {user['email']}")
    print(f"   Admin-set total_unpaid_fees: {admin_set_fees}")

    if admin_set_fees <= 0:
        print("❌ No fees to distribute (total_unpaid_fees is 0)")
        return

    # Get all unpaid transactions (excluding failed ones)
    txs = await db.transactions.find(
        {'user_id': user['id'], 'fee_paid': {'$ne': True}, 'status': {'$ne': 'failed'}},
        {'_id': 0, 'id': 1, 'fee': 1, 'fee_paid': 1, 'type': 1}
    ).to_list(None)

    if not txs:
        print("❌ No unpaid transactions found")
        return

    print(f"   Transactions to fix: {len(txs)}")
    current_sum = sum(Decimal(str(t.get('fee', '0') or '0')) for t in txs)
    print(f"   Current fee sum: {current_sum} (should be {admin_set_fees})")

    # Redistribute fees correctly
    new_fees = distribute_fees(admin_set_fees, len(txs))
    print(f"   New fee distribution (first 5): {[str(f) for f in new_fees[:5]]}")
    print(f"   New fee sum: {sum(new_fees)}")

    # Confirm before applying
    print(f"\n🔧 Will update {len(txs)} transactions to properly distribute {admin_set_fees} in fees")
    confirm = input("Proceed? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Aborted.")
        return

    # Apply updates
    updated = 0
    for tx, new_fee in zip(txs, new_fees):
        await db.transactions.update_one(
            {'id': tx['id']},
            {'$set': {'fee': str(new_fee)}}
        )
        updated += 1

    print(f"✅ Updated {updated} transactions")
    print(f"✅ User total_unpaid_fees remains: {admin_set_fees} (unchanged)")
    print("Done!")


asyncio.run(fix_user_fees())
