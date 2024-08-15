use serde_tuple::Serialize_tuple;
use serde_with::{serde_as, skip_serializing_none, DisplayFromStr};
use solana_extra_wasm::transaction_status::EncodedConfirmedTransactionWithStatusMeta;
use solana_sdk::signature::Signature;

use crate::{impl_method, utils::rpc_config::RpcTransactionConfig, ClientRequest, ClientResponse};

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetTransactionRequest {
    #[serde_as(as = "DisplayFromStr")]
    pub signature: Signature,
    pub config: Option<RpcTransactionConfig>,
}

impl_method!(GetTransactionRequest, "getTransaction");

impl GetTransactionRequest {
    pub fn new(signature: Signature) -> Self {
        Self {
            signature,
            config: None,
        }
    }
    pub fn new_with_config(signature: Signature, config: RpcTransactionConfig) -> Self {
        Self {
            signature,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetTransactionResponse(Option<EncodedConfirmedTransactionWithStatusMeta>);

impl From<GetTransactionResponse> for Option<EncodedConfirmedTransactionWithStatusMeta> {
    fn from(value: GetTransactionResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::transaction_status::{
        EncodedTransaction, UiCompiledInstruction, UiMessage, UiRawMessage, UiTransaction,
        UiTransactionEncoding, UiTransactionStatusMeta,
    };
    use solana_sdk::message::MessageHeader;
    use std::str::FromStr;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    // Serialization differs a bit from the RPC API but it is allowed too
    #[test]
    fn request() {
        let request = ClientRequest::new(GetTransactionRequest::NAME)
            .id(1)
            .params(GetTransactionRequest::new_with_config(Signature::from_str("2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv").unwrap(), RpcTransactionConfig {
                encoding: Some(UiTransactionEncoding::Json),
                ..Default::default()
            }));

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getTransaction","params":["2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv",{"encoding": "json"}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"meta":{"err":null,"fee":5000,"innerInstructions":[],"postBalances":[499998932500,26858640,1,1,1],"postTokenBalances":[],"preBalances":[499998937500,26858640,1,1,1],"preTokenBalances":[],"rewards":[],"status":{"Ok":null}},"slot":430,"transaction":{"message":{"accountKeys":["3UVYmECPPMZSCqWKfENfuoTv51fTDTWicX9xmBD2euKe","AjozzgE83A3x1sHNUR64hfH7zaEBWeMaFuAN9kQgujrc","SysvarS1otHashes111111111111111111111111111","SysvarC1ock11111111111111111111111111111111","Vote111111111111111111111111111111111111111"],"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":3,"numRequiredSignatures":1},"instructions":[{"accounts":[1,2,3,0],"data":"37u9WtQpcm6ULa3WRQHmj49EPs4if7o9f1jSRVZpm2dvihR9C8jY4NqEwXUbLwx15HBSNcP1","programIdIndex":4}],"recentBlockhash":"mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B"},"signatures":["2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv"]}},"blockTime":null,"id":1}"#;

        let response: ClientResponse<GetTransactionResponse> =
            serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        assert_eq!(
            response.result.0,
            Some(EncodedConfirmedTransactionWithStatusMeta {
                block_time: None,
                slot: 430,
                transaction:
                    solana_extra_wasm::transaction_status::EncodedTransactionWithStatusMeta {
                        transaction: EncodedTransaction::Json(UiTransaction {
                            message: UiMessage::Raw(UiRawMessage {
                                header: MessageHeader {
                                    num_readonly_signed_accounts: 0,
                                    num_readonly_unsigned_accounts: 3,
                                    num_required_signatures: 1
                                },
                                address_table_lookups: None,
                                recent_blockhash: "mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B".to_string(),
                                instructions: vec![UiCompiledInstruction {
                                    program_id_index: 4,
                                    accounts: vec![1, 2, 3, 0],
                                    data: "37u9WtQpcm6ULa3WRQHmj49EPs4if7o9f1jSRVZpm2dvihR9C8jY4NqEwXUbLwx15HBSNcP1".to_string()
                                }],
                                account_keys: vec![
                                    "3UVYmECPPMZSCqWKfENfuoTv51fTDTWicX9xmBD2euKe".to_string(),
                                    "AjozzgE83A3x1sHNUR64hfH7zaEBWeMaFuAN9kQgujrc".to_string(),
                                    "SysvarS1otHashes111111111111111111111111111".to_string(),
                                    "SysvarC1ock11111111111111111111111111111111".to_string(),
                                    "Vote111111111111111111111111111111111111111".to_string(),
                                ]
                            }),
                            signatures: vec!["2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv".to_string()]
                        }),
                        version: None,
                        meta: Some(UiTransactionStatusMeta {
                            err: None,
                            fee: 5000,
                            inner_instructions: Some(vec![]),
                            post_balances: vec![499998932500, 26858640, 1, 1, 1],
                            post_token_balances: Some(vec![]),
                            pre_balances: vec![499998937500, 26858640, 1, 1, 1],
                            pre_token_balances: Some(vec![]),
                            rewards: Some(vec![]),
                            status: Ok(()),
                            loaded_addresses: None,
                            log_messages: None,
                            return_data: None,
                        }),
                    }
            })
        );
    }
}
