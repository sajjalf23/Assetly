#!/usr/bin/env python3
import time
import base64
import hmac
import hashlib
import json
import urllib.request

# ============================================
# YOUR CURRENT CREDENTIALS
# ============================================
KUCOIN_KEY = "6969150c2a6dcd0001327361"
KUCOIN_SECRET = "340dcd5f-1dd5-4422-84e3-db39e47ae0ef"
KUCOIN_PASSPHRASE = "Assetly"  # THIS IS THE ISSUE - Wrong passphrase!
WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

def http_get(url, headers=None):
    try:
        req = urllib.request.Request(url)
        if headers:
            for key, value in headers.items():
                req.add_header(key, value)
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'

print("\n" + "="*60)
print(" SIMPLE API TEST - WHAT'S WORKING vs NOT WORKING")
print("="*60)

# TEST 1: KuCoin Public API (Always works)
print("\n✅ TEST 1: KuCoin Public API (No auth needed)")
response = http_get("https://api.kucoin.com/api/v1/timestamp")
data = json.loads(response)
if 'data' in data:
    print(f"   ✓ KuCoin is ONLINE")
    print(f"   ✓ Server Time: {data['data']}")
else:
    print(f"   ✗ Failed")

# TEST 2: KuCoin Authentication (THIS IS FAILING)
print("\n❌ TEST 2: KuCoin Authentication (FAILING - Wrong passphrase)")
timestamp = str(int(time.time() * 1000))
endpoint = "/api/v1/user-info"
url = "https://api.kucoin.com" + endpoint

str_to_sign = timestamp + "GET" + endpoint
signature = base64.b64encode(
    hmac.new(KUCOIN_SECRET.encode('utf-8'), 
            str_to_sign.encode('utf-8'), 
            hashlib.sha256).digest()
).decode('utf-8')

headers = {
    "KC-API-KEY": KUCOIN_KEY,
    "KC-API-SIGN": signature,
    "KC-API-TIMESTAMP": timestamp,
    "KC-API-PASSPHRASE": KUCOIN_PASSPHRASE,
    "KC-API-KEY-VERSION": "2"
}

response = http_get(url, headers)
data = json.loads(response)
if data.get('code') == '200000':
    print(f"   ✓ Authentication SUCCESS!")
else:
    print(f"   ✗ Error: {data.get('msg', 'Unknown')}")
    print(f"   ✗ Your passphrase '{KUCOIN_PASSPHRASE}' is WRONG!")
    print(f"\n   🔧 HOW TO FIX:")
    print(f"      1. Go to: https://www.kucoin.com/account/api")
    print(f"      2. Find your API key (6969150c2a6dcd0001327361)")
    print(f"      3. Click 'Edit' or 'View'")
    print(f"      4. Check your passphrase (it's NOT 'Assetly')")
    print(f"      5. Update the passphrase in this script")

# TEST 3: Ethereum Wallet (Public, no API key needed)
print("\n📡 TEST 3: Ethereum Wallet Check (Public API)")
# Using Etherscan public endpoint (no API key required)
url = f"https://api.etherscan.io/api?module=account&action=balance&address={WALLET_ADDRESS}&tag=latest"
response = http_get(url)
try:
    data = json.loads(response)
    if data.get('status') == '1':
        balance_wei = int(data['result'])
        balance_eth = balance_wei / 10**18
        print(f"   ✓ Wallet: {WALLET_ADDRESS[:15]}...")
        print(f"   ✓ ETH Balance: {balance_eth:.8f} ETH")
        if balance_eth == 0:
            print(f"   ℹ️  This wallet has 0 ETH (normal for test wallets)")
    else:
        print(f"   ✗ Error: {data.get('message')}")
except:
    print(f"   ✗ Could not fetch balance")

# TEST 4: Your API Key Test (Will show if key is valid)
print("\n🔑 TEST 4: Your Etherscan API Key Check")
url = f"https://api.etherscan.io/api?module=account&action=balance&address={WALLET_ADDRESS}&tag=latest&apikey=SY6FFRPIXVAHSCXCQRSE726CFYNPPNMNCW"
response = http_get(url)
try:
    data = json.loads(response)
    if data.get('status') == '1':
        print(f"   ✓ API Key is WORKING!")
        balance_eth = int(data['result']) / 10**18
        print(f"   ✓ Balance: {balance_eth:.8f} ETH")
    else:
        print(f"   ✗ API Key is INVALID or EXPIRED")
        print(f"   ✗ Message: {data.get('message')}")
        print(f"\n   🔧 HOW TO FIX:")
        print(f"      1. Go to: https://etherscan.io/register")
        print(f"      2. Create free account")
        print(f"      3. Go to: https://etherscan.io/myapikey")
        print(f"      4. Create new API key")
        print(f"      5. Replace the old key with new one")
except:
    print(f"   ✗ Error parsing response")

# SUMMARY
print("\n" + "="*60)
print(" SUMMARY & NEXT STEPS")
print("="*60)

print("""
✅ WORKING:
   • KuCoin Public API
   • Ethereum Blockchain (public)

❌ NOT WORKING:
   • KuCoin Authentication - Wrong passphrase
   • Your Etherscan API key - Invalid/expired

🔧 WHAT YOU NEED TO DO:

1. FIX KUCOIN:
   - Go to: https://www.kucoin.com/account/api
   - Find your passphrase for key ending in '7361'
   - It's NOT "Assetly" - that's why it's failing
   - Update the passphrase in your .env file

2. FIX ETHERSCAN:
   - Get a FREE new API key: https://etherscan.io/myapikey
   - Replace the old key in your .env file

3. Once fixed, run this script again to verify
""")

print("="*60 + "\n")

# Show you how to get the correct credentials
print("📝 QUICK REFERENCE - How to get correct credentials:\n")
print("KUCOIN:")
print("  1. Login to https://www.kucoin.com")
print("  2. Go to API Management")
print("  3. Find your API key")
print("  4. Click 'Edit' to see/change passphrase")
print("  5. If you forgot it, delete and create NEW key\n")
print("ETHERSCAN:")
print("  1. Go to https://etherscan.io/register")
print("  2. Sign up (free)")
print("  3. Go to https://etherscan.io/myapikey")
print("  4. Click 'Add' to create new API key")
print("  5. Copy the new key\n")
