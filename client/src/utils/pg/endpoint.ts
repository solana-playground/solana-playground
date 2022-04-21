import { Endpoints } from "../../constants";

const ENDPOINT_KEY = "endpoint";

export class PgEndpoint {
  static getLsEndpoint() {
    let endpoint = localStorage.getItem(ENDPOINT_KEY);
    if (!endpoint) {
      localStorage.setItem(ENDPOINT_KEY, Endpoints.DEVNET);
      endpoint = Endpoints.DEVNET;
    }

    return endpoint;
  }

  static setLsEndpoint(endpoint: string) {
    localStorage.setItem(ENDPOINT_KEY, endpoint);
  }
}
