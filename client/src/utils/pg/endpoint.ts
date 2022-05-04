import { Endpoint } from "../../constants";

export class PgEndpoint {
  private static ENDPOINT_KEY = "endpoint";

  static getLsEndpoint(): Endpoint {
    let endpoint = localStorage.getItem(this.ENDPOINT_KEY);
    if (!endpoint) {
      localStorage.setItem(this.ENDPOINT_KEY, Endpoint.DEVNET);
      endpoint = Endpoint.DEVNET;
    }

    return endpoint as Endpoint;
  }

  static setLsEndpoint(endpoint: string) {
    localStorage.setItem(this.ENDPOINT_KEY, endpoint);
  }
}
