declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export type ServeHandler = (
    request: Request
  ) => Response | Promise<Response>;

  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  }

  export function serve(
    handler: ServeHandler,
    options?: ServeOptions
  ): Promise<void>;
}
