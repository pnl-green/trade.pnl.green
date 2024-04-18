import { Wallet, providers, utils, constants } from 'ethers';
import {
  Cancel,
  CandleSnapshot,
  Chain,
  ChainId,
  OrderType,
  SubAccount,
} from '@/types/hyperliquid';
import { timestamp } from './timestamp';
import { signInner, signL1Action } from './signing';

export class Hyperliquid {
  // ----------------- PRIVATE -----------------
  private chain: Chain;
  private base_url: string;

  // ----------------- INITIALIZER -----------------
  constructor(base_url: string, chain = Chain.ArbitrumTestnet) {
    this.base_url = base_url;
    this.chain = chain;
  }

  // ----------------- PROTECTED -----------------
  #post = async (
    request: Record<string, any>
  ): Promise<{
    success: boolean;
    data: Record<string, any> | SubAccount[] | null;
    msg: String | null;
    error_type: String | null;
  }> => {
    return fetch(this.base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }).then((res) => res.json());
  };

  // ----------------- EXCHANGE => PLACE ORDER <= -----------------

  placeOrder = async (
    signer: Wallet,
    asset: number,
    isBuy: boolean,
    price: number | string,
    quantity: number | string,
    orderType: OrderType,
    reduceOnly = false,
    cloid: string | null = null,
    vaultAdress: string | null = null
  ) => {
    // FIXME: functionality not tested

    let nonce = timestamp();

    // TODO: parse price and quantity

    let action = {
      grouping: 'na',
      orders: [
        {
          a: asset,
          b: isBuy,
          p: price,
          s: quantity.toString(),
          r: reduceOnly,
          t: orderType,
        },
      ],
      type: 'order',
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  cancelOrder = async (
    signer: Wallet,
    cancels: Cancel[],
    vaultAdress: string | null = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'cancel',
      cancels: cancels.map((cancel) => ({
        a: cancel.asset,
        o: cancel.orderID,
      })),
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  normalTpSl = async (signer: Wallet, asset: number) => {
    // TODO: Implement normalTpSl
  };

  updateLeverage = async (
    signer: Wallet,
    asset: number,
    isCross: boolean,
    leverage: number,
    vaultAdress: string | null = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'updateLeverage',
      asset,
      isCross,
      leverage,
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  updateIsolatedMargin = async (
    signer: Wallet,
    asset: number,
    isBuy: boolean,
    ntli: number,
    vaultAdress: string | null = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'updateIsolatedMargin',
      asset,
      isBuy,
      ntli: utils.parseUnits(ntli.toString(), 6).toNumber(),
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => TWAP <= -----------------
  placeTwapOrder = async (
    signer: Wallet,
    asset: number,
    isBuy: boolean,
    minutes: number,
    reduceOnly: boolean,
    quantity: number | string,
    randomize: boolean,
    vaultAdress: string | null = null
  ) => {
    // FIXME: functionality not tested
    let nonce = timestamp();

    let action = {
      type: 'twapOrder',
      a: asset,
      b: isBuy,
      m: minutes,
      r: reduceOnly,
      s: quantity.toString(),
      t: randomize,
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => SCALE ORDER <= -----------------
  placeScaleOrder = async (
    signer: Wallet,
    asset: number,
    isBuy: boolean,
    quantity: number | string,
    scale: number,
    vaultAdress: string | null = null
  ) => {
    // FIXME: functionality not tested
    let nonce = timestamp();

    let orders = [{ a: asset, b: isBuy, s: quantity.toString(), c: scale }];

    let action = {
      grouping: 'na',
      type: 'order',
      orders,
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => SUB ACCOUNTS <= -----------------

  createSubAccount = async (
    signer: Wallet,
    name: String,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'createSubAccount',
      name,
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  subAccountModify = async (
    signer: Wallet,
    name: String,
    subAccountUser: String,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'subAccountModify',
      subAccountUser,
      name,
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  subAccountTransfer = async (
    signer: Wallet,
    isDeposit: boolean,
    subAccountUser: String,
    usd: number | string,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    let action = {
      type: 'subAccountTransfer',
      subAccountUser,
      isDeposit,
      usd: utils.parseUnits(usd.toString(), 6).toNumber(),
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  connect = async (
    signer: providers.JsonRpcSigner,
    agent: Wallet,
    extra_agent_name: String | null = null,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    let connectionId = utils.keccak256(
      extra_agent_name
        ? utils.defaultAbiCoder.encode(
            ['address', 'string'],
            [agent.address, extra_agent_name]
          )
        : utils.defaultAbiCoder.encode(['address'], [agent.address])
    );

    let action = {
      agent: {
        connectionId,
        source: 'https://hyperliquid.xyz',
      },
      agentAddress: agent.address,
      chain: this.chain,
      type: 'connect',
    };

    let chainId =
      this.chain === Chain.Arbitrum
        ? ChainId.Arbitrum
        : ChainId.ArbitrumTestnet;

    let domain = {
      chainId,
      name: 'Exchange',
      verifyingContract: constants.AddressZero,
      version: '1',
    };

    let types = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
    };

    let signature = await signInner(signer, domain, types, action.agent);

    let request = {
      endpoint: 'exchange',
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- INFO => SUB ACCOUNTS <= -----------------

  subAccounts = async (user: String) => {
    let request = {
      endpoint: 'info',
      type: 'subAccounts',
      user,
    };

    return this.#post(request);
  };

  historicalOrders = async (user: String) => {
    let request = {
      endpoint: 'info',
      type: 'historicalOrders',
      user,
    };

    return this.#post(request);
  };

  userFees = async (user: String) => {
    let request = {
      endpoint: 'info',
      type: 'userFees',
      user,
    };

    return this.#post(request);
  };

  spotMeta = async () => {
    let request = {
      endpoint: 'info',
      type: 'spotMeta',
    };

    return this.#post(request);
  };

  candleSnapshot = async (req: CandleSnapshot) => {
    let request = {
      endpoint: 'info',
      type: 'candleSnapshot',
      req,
    };

    return this.#post(request);
  };
}
