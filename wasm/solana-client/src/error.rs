use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
struct Error {
    code: i32,
    message: String,
}

impl Default for Error {
    fn default() -> Self {
        Self {
            code: reqwest::StatusCode::INTERNAL_SERVER_ERROR.as_u16() as i32,
            message: reqwest::StatusCode::INTERNAL_SERVER_ERROR
                .as_str()
                .to_owned(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientError {
    id: u16,
    jsonrpc: String,
    error: Error,
}

impl std::error::Error for ClientError {}

impl Default for ClientError {
    fn default() -> Self {
        Self {
            id: 0,
            jsonrpc: String::from("2.0"),
            error: Error::default(),
        }
    }
}

impl From<reqwest::Error> for ClientError {
    fn from(error: reqwest::Error) -> Self {
        ClientError {
            error: Error {
                code: error
                    .status()
                    .unwrap_or(
                        reqwest::StatusCode::from_u16(ClientError::default().error.code as u16)
                            .unwrap(),
                    )
                    .as_u16() as i32,
                message: error.to_string(),
            },
            ..Default::default()
        }
    }
}

impl ClientError {
    pub fn new(error_msg: &str) -> Self {
        ClientError {
            error: Error {
                code: reqwest::StatusCode::SEE_OTHER.as_u16() as i32,
                message: error_msg.to_string(),
            },
            ..Default::default()
        }
    }
}

impl fmt::Display for ClientError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(format!("Client error: {}", self.error.message).as_str())
    }
}
