use serde_tuple::Serialize_tuple;
use serde_with::skip_serializing_none;
use solana_extra_wasm::transaction_status::UiConfirmedBlock;
use solana_sdk::clock::Slot;

use crate::{impl_method, utils::rpc_config::RpcBlockConfig, ClientRequest, ClientResponse};

#[skip_serializing_none]
#[derive(Debug, Serialize_tuple)]
pub struct GetBlockRequest {
    pub slot: Slot,
    pub config: Option<RpcBlockConfig>,
}

impl_method!(GetBlockRequest, "getBlock");

impl GetBlockRequest {
    pub fn new(slot: Slot) -> Self {
        Self { slot, config: None }
    }
    pub fn new_with_config(slot: Slot, config: RpcBlockConfig) -> Self {
        Self {
            slot,
            config: Some(config),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct GetBlockResponse(UiConfirmedBlock);

impl From<GetBlockResponse> for UiConfirmedBlock {
    fn from(value: GetBlockResponse) -> Self {
        value.0
    }
}

#[cfg(test)]
mod tests {
    use serde_json::Value;
    use solana_extra_wasm::transaction_status::{
        EncodedTransaction, EncodedTransactionWithStatusMeta, TransactionDetails,
        UiCompiledInstruction, UiMessage, UiRawMessage, UiTransaction, UiTransactionEncoding,
        UiTransactionStatusMeta,
    };
    use solana_sdk::message::MessageHeader;

    use crate::{methods::Method, ClientRequest, ClientResponse};

    use super::*;

    #[test]
    fn request() {
        let request = ClientRequest::new(GetBlockRequest::NAME).id(1).params(
            GetBlockRequest::new_with_config(
                430,
                RpcBlockConfig {
                    encoding: Some(UiTransactionEncoding::Json),
                    max_supported_transaction_version: Some(0),
                    rewards: Some(false),
                    transaction_details: Some(TransactionDetails::Full),
                    commitment: None,
                },
            ),
        );

        let ser_value = serde_json::to_value(request).unwrap();
        let raw_json = r#"{"jsonrpc":"2.0","id":1,"method":"getBlock","params":[430,{"encoding":"json","maxSupportedTransactionVersion":0,"transactionDetails":"full","rewards":false}]}"#;
        let raw_value: Value = serde_json::from_str(raw_json).unwrap();

        assert_eq!(ser_value, raw_value);
    }

    #[test]
    fn response() {
        let raw_json = r#"{"jsonrpc":"2.0","result":{"blockHeight":428,"blockTime":null,"blockhash":"3Eq21vXNB5s86c62bVuUfTeaMif1N2kUqRPBmGRJhyTA","parentSlot":429,"previousBlockhash":"mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B","transactions":[{"meta":{"err":null,"fee":5000,"innerInstructions":[],"logMessages":[],"postBalances":[499998932500,26858640,1,1,1],"postTokenBalances":[],"preBalances":[499998937500,26858640,1,1,1],"preTokenBalances":[],"rewards":null,"status":{"Ok":null}},"transaction":{"message":{"accountKeys":["3UVYmECPPMZSCqWKfENfuoTv51fTDTWicX9xmBD2euKe","AjozzgE83A3x1sHNUR64hfH7zaEBWeMaFuAN9kQgujrc","SysvarS1otHashes111111111111111111111111111","SysvarC1ock11111111111111111111111111111111","Vote111111111111111111111111111111111111111"],"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":3,"numRequiredSignatures":1},"instructions":[{"accounts":[1,2,3,0],"data":"37u9WtQpcm6ULa3WRQHmj49EPs4if7o9f1jSRVZpm2dvihR9C8jY4NqEwXUbLwx15HBSNcP1","programIdIndex":4}],"recentBlockhash":"mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B"},"signatures":["2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv"]}}]},"id":1}"#;

        let response: ClientResponse<GetBlockResponse> = serde_json::from_str(raw_json).unwrap();

        assert_eq!(response.id, 1);
        assert_eq!(response.jsonrpc, "2.0");
        let value = response.result.0;

        assert_eq!(value.block_height, Some(428));
        assert!(value.block_time.is_none());
        assert_eq!(
            value.blockhash,
            "3Eq21vXNB5s86c62bVuUfTeaMif1N2kUqRPBmGRJhyTA"
        );
        assert_eq!(value.parent_slot, 429);
        assert_eq!(
            value.previous_blockhash,
            "mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B"
        );

        assert_eq!(
            value.transactions,
            Some(vec![EncodedTransactionWithStatusMeta {
                version: None,
                meta: Some(UiTransactionStatusMeta {
                    err: None,
                    status: Ok(()),
                    fee: 5000,
                    pre_balances: vec![499998937500, 26858640, 1, 1, 1],
                    post_balances: vec![499998932500, 26858640, 1, 1, 1],
                    inner_instructions: Some(vec![]),
                    log_messages: Some(vec![]),
                    pre_token_balances: Some(vec![]),
                    post_token_balances: Some(vec![]),
                    rewards: None,
                    loaded_addresses: None,
                    return_data: None
                }),
                transaction: EncodedTransaction::Json(UiTransaction {
                    signatures: vec!["2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv".to_string()],
                    message: UiMessage::Raw(UiRawMessage {
                        header: MessageHeader {
                            num_required_signatures: 1,
                            num_readonly_signed_accounts: 0,
                            num_readonly_unsigned_accounts: 3
                        },
                        account_keys: vec!["3UVYmECPPMZSCqWKfENfuoTv51fTDTWicX9xmBD2euKe".to_string(),
                        "AjozzgE83A3x1sHNUR64hfH7zaEBWeMaFuAN9kQgujrc".to_string(),
                        "SysvarS1otHashes111111111111111111111111111".to_string(),
                        "SysvarC1ock11111111111111111111111111111111".to_string(),
                        "Vote111111111111111111111111111111111111111".to_string()],
                        recent_blockhash: "mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B".to_string(),
                        instructions:vec![UiCompiledInstruction {
                            data: "37u9WtQpcm6ULa3WRQHmj49EPs4if7o9f1jSRVZpm2dvihR9C8jY4NqEwXUbLwx15HBSNcP1".to_string(),
                            accounts: vec![1, 2, 3, 0],
                            program_id_index: 4,
                        }],
                        address_table_lookups: None
                    })
                })
            }])
        );
    }
}
