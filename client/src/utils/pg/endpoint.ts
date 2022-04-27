import { Endpoints } from "../../constants";

export class PgEndpoint {
  private static ENDPOINT_KEY = "endpoint";

  static getLsEndpoint() {
    let endpoint = localStorage.getItem(this.ENDPOINT_KEY);
    if (!endpoint) {
      localStorage.setItem(this.ENDPOINT_KEY, Endpoints.DEVNET);
      endpoint = Endpoints.DEVNET;
    }

    return endpoint;
  }

  static setLsEndpoint(endpoint: string) {
    localStorage.setItem(this.ENDPOINT_KEY, endpoint);
  }
}
