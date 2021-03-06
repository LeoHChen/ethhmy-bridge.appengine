import { OPERATION_TYPE, STATUS, TOKEN } from './interfaces';
import { Action } from './Action';
import { generateActionsPool } from './generateActionsPool';

export interface IOperationInitParams {
  id: string;
  status?: STATUS;
  type: OPERATION_TYPE;
  erc20Address?: string;
  hrc20Address?: string;
  token: TOKEN;
  ethAddress: string;
  oneAddress: string;
  actions?: Array<Action>;
  timestamp?: number;
  amount: string;
}

export type TSyncOperationCallback = (operation: Operation) => Promise<void>;

export class Operation {
  id: string;
  type: OPERATION_TYPE;
  token: TOKEN;
  erc20Address?: string;
  hrc20Address?: string;
  status: STATUS;
  ethAddress: string;
  oneAddress: string;
  amount: string;
  timestamp: number;
  actions: Action[];
  rollbackActions: Action[];

  syncOperationCallback: TSyncOperationCallback;

  constructor(params: IOperationInitParams, callback: TSyncOperationCallback) {
    this.id = params.id;
    this.oneAddress = params.oneAddress;
    this.ethAddress = params.ethAddress;
    this.amount = params.amount;
    this.type = params.type;
    this.erc20Address = params.erc20Address;
    this.token = params.token;

    this.timestamp = !!params.status ? params.timestamp : Math.round(+new Date() / 1000);

    this.syncOperationCallback = callback;

    const { actions, rollbackActions } = generateActionsPool(params);

    this.actions = actions;
    this.rollbackActions = rollbackActions;

    this.status = params.status;

    if (!!this.status) {
      // init from DB
      this.actions.forEach(action => {
        const actionFromDB = params.actions.find(a => a.type === action.type);

        if (actionFromDB) {
          action.setParams(actionFromDB);
        }
      });
    } else {
      this.status = STATUS.WAITING;
    }

    if (this.status === STATUS.WAITING || this.status === STATUS.IN_PROGRESS) {
      this.startActionsPool();
    }
  }

  startActionsPool = async () => {
    let actionIndex = 0;

    // TODO: add mode for continue operation loading from DB
    if (this.actions.some(a => a.status !== STATUS.WAITING)) {
      return;
    }

    this.status = STATUS.IN_PROGRESS;

    console.log('----- Operation -------', this.type, this.token);

    while (this.actions[actionIndex]) {
      const action = this.actions[actionIndex];

      if (action.status === STATUS.WAITING) {
        const res = await action.call();

        if (!res) {
          this.status = STATUS.ERROR;
          await this.syncOperationCallback(this);

          if (action.startRollbackOnFail) {
            this.actions = this.actions.concat(this.rollbackActions);
          } else {
            return;
          }
        }

        await this.syncOperationCallback(this);
      }

      actionIndex++;
    }

    if (this.status === STATUS.IN_PROGRESS) {
      this.status = STATUS.SUCCESS;
    }

    console.log('----- END -------', this.type, this.token);

    await this.syncOperationCallback(this);
  };

  toObject = (params?: { payload?: boolean }) => {
    return {
      id: this.id,
      type: this.type,
      erc20Address: this.erc20Address,
      hrc20Address: this.hrc20Address,
      token: this.token,
      status: this.status,
      amount: this.amount,
      ethAddress: this.ethAddress,
      oneAddress: this.oneAddress,
      timestamp: this.timestamp || this.actions[0].timestamp,
      actions: this.actions.map(a => a.toObject(params)),
    };
  };
}
