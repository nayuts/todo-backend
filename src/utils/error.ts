// src/utils/error.ts
class BaseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = new.target.name;

    // instanceof による独自エラーの型判定を正しく機能させるためのおまじない（興味があったら調べてみよう！）
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SqlError extends BaseError {}
export class NotFoundDataError extends BaseError {}