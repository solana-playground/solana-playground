use solana_sdk::{instruction::Instruction, pubkey::Pubkey};

pub trait WithMemo {
    fn with_memo<T: AsRef<str>>(self, memo: Option<T>) -> Self;
}

impl WithMemo for Vec<Instruction> {
    fn with_memo<T: AsRef<str>>(mut self, memo: Option<T>) -> Self {
        if let Some(memo) = &memo {
            let memo = memo.as_ref();
            let memo_ix = Instruction {
                program_id: Pubkey::try_from(
                    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr".as_bytes(),
                )
                .unwrap(),
                accounts: vec![],
                data: memo.as_bytes().to_vec(),
            };
            self.push(memo_ix);
        }
        self
    }
}
