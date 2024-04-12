import { serialize } from '@ygoe/msgpack';
import { Signer, TypedDataDomain } from 'ethers';
import { TypedDataField } from 'ethers';
import { TypedDataEncoder } from 'ethers';
import { encodeBase64 } from 'ethers';
import { keccak256 } from 'ethers';

export const sign_l1_action = async (
  signer: Signer,
  action: Record<string, any>,
  vault_address: String | null,
  nonce: number,
  is_mainnet: boolean
): Promise<String> => {
  let hash = action_hash(action, vault_address, nonce);
  let phantom_agent = construct_phantom_agent(hash, is_mainnet);
  let data = {
    domain: {
      chainId: 1337,
      name: 'Exchange',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      version: '1',
    },
    types: {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
      // EIP712Domain: [
      //   { name: 'name', type: 'string' },
      //   { name: 'version', type: 'string' },
      //   { name: 'chainId', type: 'uint256' },
      //   { name: 'verifyingContract', type: 'address' },
      // ],
    },
    primaryType: 'Agent',
    message: phantom_agent,
  };

  return sign_inner(signer, data);
};

const action_hash = (
  action: Record<string, any>,
  vault_address: String | null,
  nonce: number
) => {
  const dataBinary = packb(action);
  const dataHex = binary_to_base16(dataBinary);
  let data = dataHex;
  data += '00000' + int_to_base16(nonce);
  if (vault_address === undefined) {
    data += '00';
  } else {
    data += '01';
    data += vault_address;
  }
  return hash(base16_to_binary(data), keccak256, 'binary');
};

const packb = (data: any) => {
  return serialize(data);
};

const binary_to_base16 = (data: any) => {
  return Buffer.from(data).toString('hex');
};

const int_to_base16 = (int: number) => {
  return int.toString(16);
};

const base16_to_binary = (data: String) => {
  return Buffer.from(data, 'hex');
};

type Input = string | Uint8Array;

type CHash = (data: Input) => string;

type Digest = 'hex' | 'binary' | 'base64';

const encoders = {
  binary: (x: any) => x,
  hex: base16_to_binary,
  base64: encodeBase64,
};

const hash = (data: Input, hash: CHash, digest: Digest = 'hex') => {
  let binary = hash(data);

  return encoders[digest](binary);
};

const construct_phantom_agent = (
  connection_id: String,
  is_mainnet: boolean
) => {
  return { source: is_mainnet ? 'a' : 'b', connection_id };
};

const sign_inner = async (
  signer: Signer,
  data: {
    domain: TypedDataDomain;
    types: Record<string, TypedDataField[]>;
    message: Record<string, any>;
    primaryType: String;
  }
) => {
  let msg = eth_encoded_structured_data(data);

  let signature = await signer.signMessage(msg);

  return signature;
};

const eth_encoded_structured_data = (data: {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  message: Record<string, any>;
}) => {
  return base16_to_binary(
    TypedDataEncoder.encode(data.domain, data.types, data.message).slice(-132)
  );
};
