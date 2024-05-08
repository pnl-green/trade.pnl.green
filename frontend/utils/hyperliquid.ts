import { providers, utils, constants } from 'ethers';
import {
  AssetCtx,
  Cancel,
  CandleSnapshot,
  Chain,
  ChainId,
  Meta,
  OrderType,
  SubAccount,
} from '@/types/hyperliquid';
import { timestamp } from './timestamp';
import { signInner } from './signing';

export class Hyperliquid {
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
    data: Record<string, any> | SubAccount[] | null | string;
    msg: String | null;
  }> => {
    return fetch(this.base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
    }).then((res) => res.json());
  };

  // ----------------- EXCHANGE => PLACE ORDER <= -----------------

  placeOrder = async (
    asset: number,
    isBuy: boolean,
    limitPx: number | string,
    sz: number | string,
    orderType: OrderType,
    reduceOnly = false,
    cloid: string | null = null,
    vaultAdress: string | null = null
  ) => {
    // TODO: parse limitPx and sz

    let action = {
      grouping: 'na',
      orders: [
        {
          asset,
          isBuy,
          limitPx,
          sz,
          reduceOnly,
          orderType,
          cloid,
        },
      ],
    };

    let request = {
      endpoint: 'exchange',
      type: 'order',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  cancelOrder = async (
    cancels: Cancel[],
    vaultAdress: string | null = null
  ) => {
    let action = {
      cancels: cancels.map((cancel) => ({
        a: cancel.asset,
        o: cancel.orderID,
      })),
    };

    let request = {
      endpoint: 'exchange',
      type: 'cancel',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  normalTpSl = async (asset: number) => {
    // TODO: Implement normalTpSl
  };

  updateLeverage = async (
    asset: number,
    isCross: boolean,
    leverage: number,
    vaultAdress: string | null = null
  ) => {
    let action = {
      asset,
      isCross,
      leverage,
    };

    let request = {
      endpoint: 'exchange',
      type: 'updateLeverage',
      action,
      isFrontend: true,
      vaultAdress,
    };

    return this.#post(request);
  };

  updateIsolatedMargin = async (
    asset: number,
    isBuy: boolean,
    ntli: number,
    vaultAdress: string | null = null
  ) => {
    let action = {
      asset,
      isBuy,
      ntli: utils.parseUnits(ntli.toString(), 6).toNumber(),
    };

    let request = {
      endpoint: 'exchange',
      type: 'updateIsolatedMargin',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => TWAP <= -----------------
  placeTwapOrder = async (
    asset: number,
    isBuy: boolean,
    minutes: number,
    reduceOnly: boolean,
    quantity: number | string,
    randomize: boolean,
    vaultAdress: string | null = null
  ) => {
    let action = {
      a: asset,
      b: isBuy,
      m: minutes,
      r: reduceOnly,
      s: quantity.toString(),
      t: randomize,
    };

    let request = {
      endpoint: 'exchange',
      type: 'twapOrder',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => SCALE ORDER <= -----------------
  placeScaleOrder = async (
    asset: number,
    isBuy: boolean,
    quantity: number | string,
    scale: number,
    vaultAdress: string | null = null
  ) => {
    let orders = [{ a: asset, b: isBuy, s: quantity.toString(), c: scale }];

    let action = {
      grouping: 'na',
      orders,
    };

    let request = {
      endpoint: 'exchange',
      type: 'order',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  // ----------------- EXCHANGE => SUB ACCOUNTS <= -----------------

  createSubAccount = async (name: String, vaultAdress = null) => {
    let action = {
      name,
    };

    let request = {
      endpoint: 'exchange',
      type: 'createSubAccount',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  subAccountModify = async (
    name: String,
    subAccountUser: String,
    vaultAdress = null
  ) => {
    let action = {
      subAccountUser,
      name,
    };

    let request = {
      endpoint: 'exchange',
      type: 'subAccountModify',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  subAccountTransfer = async (
    isDeposit: boolean,
    subAccountUser: String,
    usd: number | string,
    vaultAdress = null
  ) => {
    let action = {
      subAccountUser,
      isDeposit,
      usd: utils.parseUnits(usd.toString(), 6).toNumber(),
    };

    let request = {
      endpoint: 'exchange',
      type: 'subAccountTransfer',
      action,
      vaultAdress,
    };

    return this.#post(request);
  };

  connect = async (user: String) => {
    return this.#post({
      endpoint: 'connect',
      user,
    });
  };

  connectAgent = async (
    signer: providers.JsonRpcSigner,
    agentAddress: String,
    extra_agent_name: String | null = null,
    vaultAdress = null
  ) => {
    let nonce = timestamp();

    let connectionId = utils.keccak256(
      extra_agent_name
        ? utils.defaultAbiCoder.encode(
            ['address', 'string'],
            [agentAddress, extra_agent_name]
          )
        : utils.defaultAbiCoder.encode(['address'], [agentAddress])
    );

    let action = {
      agent: {
        connectionId,
        source: 'https://hyperliquid.xyz',
      },
      agentAddress,
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
      type: 'connect',
      action,
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

  metaAndAssetCtxs = async (meta: Meta, assetCtxs: AssetCtx[]) => {
    return meta.universe.map((universe, assetId) => ({
      assetId,
      universe,
      assetCtx: assetCtxs[assetId],
    }));
  };
}

export const parsePrice = (px: number) => {
  let pxFormatted = px.toFixed(6);

  let pxAdjusted: string;
  if (pxFormatted.startsWith('0.')) {
    pxAdjusted = pxFormatted;
  } else {
    let pxSplit = pxFormatted.split('.');
    let whole = pxSplit[0];
    let decimals = pxSplit[1];

    let diff = 5 - whole.length; // 0
    let sep = diff > 0 ? '.' : '';

    pxAdjusted = `${whole}${sep}${decimals}`.match(
      new RegExp(`^-?\\d+(?:\\.\\d{0,${diff}})?`, 'g')
    )![0];
  }

  let pxCleaned = removeTrailingZeros(pxAdjusted);

  return positive(pxCleaned);
};

export const parseSize = (sz: number, szDecimals: number) => {
  let szFormatted = sz.toFixed(szDecimals);

  let px = removeTrailingZeros(szFormatted);

  return positive(px);
};

const removeTrailingZeros = (s: string) => {
  let result = s;
  while (result.endsWith('0')) {
    result = result.slice(0, -1);
  }
  if (result.endsWith('.')) {
    result = result.slice(0, -1);
  }
  return result;
};

const positive = (value: string) => {
  return value.startsWith('-') ? '0' : value;
};
