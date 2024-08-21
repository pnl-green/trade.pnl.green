# Back-end server API documentation

- [Back-end server API documentation](#back-end-server-api-documentation)
  - [HTTP API](#http-api)
    - [Info `POST /hyperliquid`](#info-post-hyperliquid)
      - [subAccounts](#subaccounts)
      - [historicalOrders](#historicalorders)
      - [userFees](#userfees)
      - [candleSnapshot](#candlesnapshot)
      - [spotMeta](#spotmeta)
      - [pairCandleSnapshot](#paircandlesnapshot)
    - [Exchange `POST /hyperliquid`](#exchange-post-hyperliquid)
      - [order](#order)
      - [createSubAccount](#createsubaccount)
      - [subAccountModify](#subaccountmodify)
      - [subAccountTransfer](#subaccounttransfer)
      - [updateLeverage](#updateleverage)
      - [updateIsolatedMargin](#updateisolatedmargin)
      - [normalTpsl](#normaltpsl)
      - [cancel](#cancel)
      - [twapOrder](#twaporder)
    - [`GET /status`](#get-status)
  - [WS API](#ws-api)
    - [pairs\_candle](#pairs_candle)

## HTTP API

### Info `POST /hyperliquid`

#### subAccounts

Query user sub-accounts

`user` - The user's address in 42-character hexadecimal format; e.g. `0x0000000000000000000000000000000000000000`

Example:
```json
{
    "endpoint": "info",
    "type": "subAccounts",
    "user": "0x0000000000000000000000000000000000000000"
}
```

#### historicalOrders

!!! Same as [subAccounts](#subaccounts) on the back-end

Example:
```json
{
    "endpoint": "info",
    "type": "historicalOrders",
    "user": "0x0000000000000000000000000000000000000000"
}
```

#### userFees

!!! Same as [subAccounts](#subaccounts) on the back-end

Example:
```json
{
    "endpoint": "info",
    "type": "userFees",
    "user": "0x0000000000000000000000000000000000000000"
}
```

#### candleSnapshot

Retrieve candle snapshot for a coin

`coin` - The coin to retrieve the candle snapshot for e.g `BTC`, `ETH`, etc

`interval` - The interval to retrieve the candle snapshot for

`start_time` - Start time in milliseconds, inclusive

`end_time` - End time in milliseconds, inclusive.

Example:
```json
{
    "endpoint": "info",
    "type": "candleSnapshot",
    "req": {
        "coin": "BTC",
        "interval": "1h",
        "startTime": 1722853079000,
        "endTime": 1722951779000
    }
}
```

#### spotMeta

#### pairCandleSnapshot

Retrieve candle snapshot for a coin pair

`coin` - The left pair to retrieve the candle snapshot for e.g `BTC`, `ETH`, etc

`interval` - The interval to retrieve the candle snapshot for

`start_time` - Start time in milliseconds, inclusive

`end_time` - End time in milliseconds, inclusive

`pair_coin` - The right pair to retrieve the candle snapshot for e.g `BTC`, `ETH`, etc.

Example: 
```json
{
    "endpoint": "info",
    "type": "candleSnapshot",
    "req": {
        "coin": "BTC",
        "interval": "1h",
        "startTime": 1722853079000,
        "endTime": 1722951779000
    },
    "pair_coin": "ETH"
}
```
Returns pair candle snapshot for BTC/ETH.

### Exchange `POST /hyperliquid`

#### order

Place an order

`orders` - The orders to place

`vaultAddress` - If trading on behalf of a vault, its onchain address in 42-character hexadecimal format e.g. 0x0000000000000000000000000000000000000000

`cloid` in argument order is an optional 128 bit hex string, e.g. 0x1234567890abcdef1234567890abcdef


```json
{
    "endpoint": "exchange",
    "type": "order",
    "action": {
        "orders": [
            {
                "asset": 0,
                "isBuy": true,
                "limitPx": "String",
                "sz": "String",
                "reduceOnly": true,
                "orderType": {
                    "limit": {
                        "tif": "Alo" // | "Ioc" | "Gtc" 
                    },
                    // or
                    "trigger": {
                        "isMarket": true,
                        "triggerPx": "String",
                        "tpsl": "tp" // | "sl"
                    }
                },
                "cloid": "uuid"
            }
        ]
    },
    "vaultAddress?": "0x0000000000000000000000000000000000000000"
}
```

#### createSubAccount

Create subaccount for the user

`name` - The name of the subaccount

```json
{
    "endpoint": "exchange",
    "type": "createSubAccount",
    "action": {
        "name": "String"
    }
}
```

#### subAccountModify

Rename subaccount

`name` - The new name of the subaccount

`subAccountUser` - The address of the subaccount to rename

```json
{
    "endpoint": "exchange",
    "type": "subAccountModify",
    "action": {
        "name": "String",
        "subAccountUser": "0x0000000000000000000000000000000000000000"
    }
}
```

#### subAccountTransfer

Transfer funds between subaccounts

`subAccountUser` - The subaccount to transfer from

```json
{
    "endpoint": "exchange",
    "type": "subAccountTransfer",
    "action": {
        "isDeposit": false,
        "subAccountUser": "0x0000000000000000000000000000000000000000",
        "usd": 0
    }
}
```

#### updateLeverage

Update cross or isolated leverage on a coin

`leverage` - The new leverage to set

`asset` - The asset to set the leverage for

`isCross` - true if cross leverage, false if isolated leverage

```json
{
    "endpoint": "exchange",
    "type": "updateLeverage",
    "action": {
        "asset": 0,
        "isCross": false,
        "leverage": 0
    }
}
```

#### updateIsolatedMargin

Add or remove margin from isolated position

`asset` - The asset to set the margin for

`isBuy` - true if adding margin, false if removing margin

`ntli` - The new margin to set

```json
{
    "endpoint": "exchange",
    "type": "updateIsolatedMargin",
    "action": {
        "asset": 0,
        "isBuy": false,
        "ntli": -1
    }
}
```
#### normalTpsl

Place a normal order with tpsl order

`orders` - The orders to place

`vaultAddress` - If trading on behalf of a vault, its onchain address in 42-character hexadecimal format e.g. 0x0000000000000000000000000000000000000000

```json
{
    "endpoint": "exchange",
    "type": "normalTpsl",
    "action": {
        "orders": [
            {
                "asset": 0,
                "isBuy": true,
                "limitPx": "String",
                "sz": "String",
                "reduceOnly": true,
                "orderType": {
                    "limit": {
                        "tif": "Alo" // | "Ioc" | "Gtc" 
                    },
                    // or
                    "trigger": {
                        "isMarket": true,
                        "triggerPx": "String",
                        "tpsl": "tp" // | "sl"
                    }
                },
                "cloid": "uuid"
            }
        ]
    },
    "vaultAddress?": "0x0000000000000000000000000000000000000000"
}
```

#### cancel

Cancel an order

`cancels` - The orders to cancel

`vaultAddress` - If trading on behalf of a vault, its onchain address in 42-character hexadecimal format e.g. 0x0000000000000000000000000000000000000000

```json
{
    "endpoint": "exchange",
    "type": "cancel",
    "action": {
        "cancels": [
            {
                "asset": 0,
                "oid": 0
            }
        ]
    },
    "vaultAddress?": "0x0000000000000000000000000000000000000000"
}
```

#### twapOrder

Place a TWAP order

```json
{
    "endpoint": "exchange",
    "type": "twapOrder",
    "action": {
        "twap": {
            "asset": 0,
            "isBuy": false,
            "runtime": 0,
            "reduceOnly": false,
            "sz": 0.0,
            "randomize": false,
            "frequency": 0
        }
    },
    "vaultAddress?": "0x0000000000000000000000000000000000000000"
}
```

### `GET /status`

Returns `OK`

## WS API

### pairs_candle

Subscribes to a candle coin pair and streams data

Subscription example:
```json
{
    "method": "pairs_candle",
    "data": {
        "symbol_left": "BTC",
        "symbol_right": "ETH"
    }
}
```
