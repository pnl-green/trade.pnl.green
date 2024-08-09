# Back-end server API documentation

- [Back-end server API documentation](#back-end-server-api-documentation)
  - [HTTP API](#http-api)
    - [`POST /hyperliquid`](#post-hyperliquid)
      - [subAccounts](#subaccounts)
      - [historicalOrders](#historicalorders)
      - [userFees](#userfees)
      - [candleSnapshot](#candlesnapshot)
      - [spotMeta](#spotmeta)
      - [pairCandleSnapshot](#paircandlesnapshot)
    - [`GET /status`](#get-status)
  - [WS API](#ws-api)
    - [pairs\_candle](#pairs_candle)

## HTTP API

### `POST /hyperliquid`

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

!!! Same as [subAccounts](#subaccounts)

#### userFees

!!! Same as [subAccounts](#subaccounts)

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
