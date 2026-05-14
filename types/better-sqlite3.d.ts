declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    close(): void;
  }

  interface Statement {
    all(...params: any[]): any[];
    get(...params: any[]): any;
    run(...params: any[]): any;
  }

  class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): Statement;
    close(): void;
  }

  export = Database;
}
