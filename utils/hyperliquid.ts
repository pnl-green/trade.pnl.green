import { Wallet, providers, utils, constants } from 'ethers';
import { Chain, ChainId, OrderType, SubAccount } from '@/types/hyperliquid';
import { timestamp } from './timestamp';
import { signInner, signL1Action } from './signing';

export class Hyperliquid {
  // ----------------- PRIVATE -----------------
  private exchange = 'hyperliquid';
  private EXCHANGE_URL = '/exchange';
  private INFO_URL = '/info';

  private chain: Chain;
  private base_url: string;

  // ----------------- INITIALIZER -----------------
  constructor(base_url: string, chain = Chain.ArbitrumTestnet) {
    this.base_url = base_url;
    this.chain = chain;
  }

  // ----------------- PROTECTED -----------------
  #post = async (
    endpoint: string,
    request: Record<string, any>
  ): Promise<{
    success: boolean;
    data: Record<string, any> | SubAccount[] | null;
    msg: String | null;
    error_type: String | null;
  }> => {
    let url = `${this.base_url}${endpoint}`;

    return fetch(url, {
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
    assetId: number,
    isBuy: boolean,
    price: number | string,
    quantity: number | string,
    orderType: OrderType,
    reduce_only = false,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    // TODO: parse price and quantity

    let action = {
      grouping: 'na',
      orders: [
        {
          a: assetId,
          b: isBuy,
          p: price,
          r: reduce_only,
          s: quantity,
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
      exchange: this.exchange,
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(this.EXCHANGE_URL, request);
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
      exchange: this.exchange,
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(this.EXCHANGE_URL, request);
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
      exchange: this.exchange,
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(this.EXCHANGE_URL, request);
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
      isDeposit,
      subAccountUser,
      type: 'subAccountTransfer',
      usd: utils.parseUnits(usd.toString(), 6),
    };

    let signature = await signL1Action(
      signer,
      action,
      nonce,
      this.chain,
      vaultAdress
    );

    let request = {
      exchange: this.exchange,
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(this.EXCHANGE_URL, request);
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
      exchange: this.exchange,
      action,
      isFrontend: true,
      nonce,
      signature,
      vaultAdress,
    };

    return this.#post(this.EXCHANGE_URL, request);
  };

  // ----------------- INFO => SUB ACCOUNTS <= -----------------

  subAccounts = async (user: String) => {
    let request = {
      exchange: this.exchange,
      type: 'subAccounts',
      user,
    };

    return this.#post(this.INFO_URL, request);
  };
}
