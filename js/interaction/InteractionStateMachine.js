/**
 * 交互状态机
 * 管理导航/悬停/模态框/模型交互四种状态
 */

export const InteractionState = {
  NAVIGATE: 'navigate',
  HOVER: 'hover',
  MODAL: 'modal',
  MODEL_INTERACT: 'model3d'
};

export class InteractionStateMachine {
  constructor() {
    this.currentState = InteractionState.NAVIGATE;
    this.previousState = null;
    this.listeners = new Map();
  }

  /**
   * 状态转换规则
   */
  canTransition(from, to) {
    const allowed = {
      [InteractionState.NAVIGATE]: [InteractionState.HOVER, InteractionState.MODAL, InteractionState.MODEL_INTERACT],
      [InteractionState.HOVER]: [InteractionState.NAVIGATE, InteractionState.MODAL],
      [InteractionState.MODAL]: [InteractionState.NAVIGATE],
      [InteractionState.MODEL_INTERACT]: [InteractionState.NAVIGATE]
    };
    return allowed[from]?.includes(to) ?? false;
  }

  /**
   * 执行状态转换
   */
  transition(newState) {
    if (!this.canTransition(this.currentState, newState)) {
      console.warn(`非法状态转换: ${this.currentState} → ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.emit('stateChange', { from: this.previousState, to: this.currentState });
    return true;
  }

  /**
   * 注册状态变更监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  is(state) {
    return this.currentState === state;
  }

  get() {
    return this.currentState;
  }
}
