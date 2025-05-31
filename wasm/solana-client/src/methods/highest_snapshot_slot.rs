use crate::{impl_method, ClientRequest, ClientResponse};

#[derive(Debug, Serialize)]
pub struct GetHighestSnapshotSlotRequest;

impl_method!(GetHighestSnapshotSlotRequest, "getHighestSnapshotSlot");

#[derive(Debug, Deserialize)]
pub struct GetHighestSnapshotSlotResponse {
    pub full: u64,
    pub incremental: Option<u64>,
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetHighestSnapshotSlotRequest::NAME)
            .id(1)
            .params(GetHighestSnapshotSlotRequest);

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getHighestSnapshotSlot"}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"full":100,"incremental":110},"id":1}"#;

        let response: ClientResponse<GetHighestSnapshotSlotResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(response.result.full, 100);
        assert_eq!(response.result.incremental, Some(110));
    }
}
