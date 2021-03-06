import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { WSProvider } from '@harmony-js/network';

import { HmyManager } from './HmyManager';
import { HmyMethods } from './HmyMethods';

import hmyManagerJson = require('../contracts/LINKHmyManager.json');
import hmyMultiSigWalletJson = require('../contracts/MultiSigWallet.json');
import hmyManagerERC20Json = require('../contracts/HmyManagerERC20.json');
import erc20Json = require('../contracts/MyERC20.json');
import { HmyMethodsERC20 } from './HmyMethodsERC20';
import { HmyEventsTracker } from './HmyEventsTracker';
import { HmyTokensTracker } from './HmyTokensTracker';
// import { sleep } from '../utils';

export * from './HmyMethods';
export * from './HmyMethodsERC20';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

export const hmyWSProvider = new WSProvider('wss://ws.s0.b.hmny.io', {
  chainType: ChainType.Harmony,
  chainId: ChainID.HmyTestnet,
});

export const hmyWS = new Harmony('wss://ws.s0.b.hmny.io', {
  chainType: ChainType.Harmony,
  chainId: ChainID.HmyTestnet,
});

hmyWS.setProvider(hmyWSProvider);

// const ping = async () => {
//   while (true) {
//     if (!hmyWSProvider.connected) {
//       console.log('hmy_WS Connected: ', hmyWSProvider.connected);
//     }
//     await sleep(3000);
//   }
// };
//
// ping();

const hmyManagerMultiSig = new HmyManager(hmyMultiSigWalletJson, process.env.HMY_MULTISIG_WALLET);

const busdContract = hmy.contracts.createContract(erc20Json.abi, process.env.HMY_BUSD_CONTRACT);
const linkContract = hmy.contracts.createContract(erc20Json.abi, process.env.HMY_LINK_CONTRACT);

const hmyBUSDManager = new HmyManager(hmyManagerJson, process.env.HMY_BUSD_MANAGER_CONTRACT);
const hmyLINKManager = new HmyManager(hmyManagerJson, process.env.HMY_LINK_MANAGER_CONTRACT);

const hmyEventsTracker = new HmyEventsTracker({ hmySdk: hmy, hmyManagerMultiSig });

export const hmyMethodsBUSD = new HmyMethods({
  hmySdk: hmy,
  hmyTokenContract: busdContract,
  hmyManager: hmyBUSDManager,
  hmyManagerMultiSig,
  hmyEventsTracker,
});

export const hmyMethodsLINK = new HmyMethods({
  hmySdk: hmy,
  hmyTokenContract: linkContract,
  hmyManager: hmyLINKManager,
  hmyManagerMultiSig,
  hmyEventsTracker,
});

// ERC20
const hmyManagerERC20 = new HmyManager(hmyManagerERC20Json, process.env.HMY_ERC20_MANAGER_CONTRACT);
// fake address - using only for logs decode
const hmyTokenContract = hmy.contracts.createContract(erc20Json.abi, '');

export const hmyMethodsERC20 = new HmyMethodsERC20({
  hmySdk: hmy,
  hmyTokenContract: hmyTokenContract,
  hmyManager: hmyManagerERC20,
  hmyManagerMultiSig,
  hmyEventsTracker,
});

export const hmyTokensTracker = new HmyTokensTracker({ hmySdk: hmy });
